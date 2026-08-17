type Point = { lat: number; lng: number }

interface WheelFacility {
  kind?: string
  lon?: string | number
  lat?: string | number
  location?: string
  width?: number
  slope?: number
}

interface ConstructionFeature {
  geometry?: { coordinates?: unknown }
  properties?: { Ac_no?: string; IsBlock?: string; Addr?: string; WItem?: string; Ce_Da?: string }
}

interface ConstructionCollection {
  features?: ConstructionFeature[]
}

export interface RouteAssessment {
  accessibilityScore: number
  safetyScore: number
  hardBarrier: boolean
  facilityCounts: Record<string, number>
  constructionCount: number
  constructionConflicts: Array<{
    id: string
    road: string
    section: string
    until: string
    severity: 'blocked' | 'narrowed'
    note: string
  }>
  blockedConstruction?: { point: Point; address?: string }
}

const WHEEL_TYPES = ['1', '7', '11', '12', '13'] as const
const KIND_LABELS: Record<string, string> = {
  '1': '斜坡道',
  '7': '無障礙出入口',
  '11': '人行道',
  '12': '標線型人行道',
  '13': '行穿線',
}

let wheelCache: { expires: number; data: WheelFacility[] } | undefined
let constructionCache: { expires: number; data: ConstructionFeature[] } | undefined

/** 這裡用的是 { lat, lng } 版本，僅供本檔使用；對外請用 geo.ts 的 decodePolyline */
function decodePolyline(encoded = ''): Point[] {
  const points: Point[] = []
  let index = 0
  let lat = 0
  let lng = 0
  while (index < encoded.length) {
    const values: number[] = []
    for (let axis = 0; axis < 2; axis++) {
      let result = 0
      let shift = 0
      let byte: number
      do {
        byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20 && index < encoded.length)
      values.push(result & 1 ? ~(result >> 1) : result >> 1)
    }
    lat += values[0] ?? 0
    lng += values[1] ?? 0
    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

/** TWD97 TM2 zone 121 (EPSG:3826) -> WGS84. */
function twd97ToWgs84(x: number, y: number): Point {
  const a = 6378137
  const b = 6356752.314245
  const lng0 = 121 * Math.PI / 180
  const k0 = 0.9999
  const dx = 250000
  const e = Math.sqrt(1 - (b * b) / (a * a))
  const x1 = x - dx
  const m = y / k0
  const mu = m / (a * (1 - e ** 2 / 4 - 3 * e ** 4 / 64 - 5 * e ** 6 / 256))
  const e1 = (1 - Math.sqrt(1 - e ** 2)) / (1 + Math.sqrt(1 - e ** 2))
  const j1 = 3 * e1 / 2 - 27 * e1 ** 3 / 32
  const j2 = 21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32
  const j3 = 151 * e1 ** 3 / 96
  const j4 = 1097 * e1 ** 4 / 512
  const fp = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu)
  const e2 = e ** 2 / (1 - e ** 2)
  const c1 = e2 * Math.cos(fp) ** 2
  const t1 = Math.tan(fp) ** 2
  const r1 = a * (1 - e ** 2) / (1 - e ** 2 * Math.sin(fp) ** 2) ** 1.5
  const n1 = a / Math.sqrt(1 - e ** 2 * Math.sin(fp) ** 2)
  const d = x1 / (n1 * k0)
  const lat = fp - (n1 * Math.tan(fp) / r1) * (d ** 2 / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * e2) * d ** 4 / 24 + (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * e2 - 3 * c1 ** 2) * d ** 6 / 720)
  const lng = lng0 + (d - (1 + 2 * t1 + c1) * d ** 3 / 6 + (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * e2 + 24 * t1 ** 2) * d ** 5 / 120) / Math.cos(fp)
  return { lat: lat * 180 / Math.PI, lng: lng * 180 / Math.PI }
}

function distanceMeters(a: Point, b: Point) {
  const lat = (a.lat + b.lat) * Math.PI / 360
  const x = (a.lng - b.lng) * 111320 * Math.cos(lat)
  const y = (a.lat - b.lat) * 110540
  return Math.hypot(x, y)
}

function routeDistance(point: Point, route: Point[]) {
  let min = Infinity
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!
    const b = route[i]!
    const scale = Math.cos(point.lat * Math.PI / 180)
    const ax = (a.lng - point.lng) * 111320 * scale
    const ay = (a.lat - point.lat) * 110540
    const bx = (b.lng - point.lng) * 111320 * scale
    const by = (b.lat - point.lat) * 110540
    const dx = bx - ax
    const dy = by - ay
    const lengthSquared = dx * dx + dy * dy
    const t = lengthSquared ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared)) : 0
    min = Math.min(min, Math.hypot(ax + t * dx, ay + t * dy))
  }
  if (route.length === 1) min = distanceMeters(point, route[0]!)
  return min
}

function facilityPoints(item: WheelFacility): Point[] {
  if (item.location) {
    const values = item.location.split('|').map(Number).filter(Number.isFinite)
    const points: Point[] = []
    for (let i = 0; i + 1 < values.length; i += 2) points.push({ lng: values[i]!, lat: values[i + 1]! })
    return points
  }
  const lat = Number(item.lat)
  const lng = Number(item.lon)
  return lat > 20 && lng > 110 ? [{ lat, lng }] : []
}

function flattenNumbers(value: unknown): number[] {
  return Array.isArray(value) ? value.flatMap(flattenNumbers) : typeof value === 'number' ? [value] : []
}

function constructionPoints(feature: ConstructionFeature): Point[] {
  const values = flattenNumbers(feature.geometry?.coordinates)
  const points: Point[] = []
  for (let i = 0; i + 1 < values.length; i += 2) {
    const x = values[i]!
    const y = values[i + 1]!
    if (x > 100000 && y > 2000000) points.push(twd97ToWgs84(x, y))
  }
  return points
}

async function getWheelFacilities(force = false) {
  if (!force && wheelCache && wheelCache.expires > Date.now()) return wheelCache.data
  const result = await Promise.all(WHEEL_TYPES.map((type) =>
    $fetch<WheelFacility[]>(`https://wheelroute.gov.taipei/wheelrouteApi/api/facility/Get/${type}`),
  ))
  const data = result.flat()
  wheelCache = { expires: Date.now() + 60 * 60_000, data }
  return data
}

async function getConstructions(force = false) {
  if (!force && constructionCache && constructionCache.expires > Date.now()) return constructionCache.data
  const text = await $fetch<string>('https://tpnco.blob.core.windows.net/blobfs/Todaywork.json', { responseType: 'text' })
  const parsed = JSON.parse(text.replace(/^\uFEFF/, '')) as ConstructionCollection
  const data = parsed.features ?? []
  constructionCache = { expires: Date.now() + 10 * 60_000, data }
  return data
}

export async function getRouteDataSourceStatus(force = false) {
  const checkedAt = new Date().toISOString()
  const [wheel, construction] = await Promise.allSettled([
    getWheelFacilities(force),
    getConstructions(force),
  ])
  return {
    checkedAt,
    wheelRoute: wheel.status === 'fulfilled'
      ? {
          reachable: true,
          recordCount: wheel.value.length,
          validCoordinateCount: wheel.value.filter((item) => facilityPoints(item).length > 0).length,
          facilityTypes: WHEEL_TYPES,
          cacheMinutes: 60,
        }
      : { reachable: false, error: wheel.reason instanceof Error ? wheel.reason.message : String(wheel.reason) },
    todayConstruction: construction.status === 'fulfilled'
      ? {
          reachable: true,
          recordCount: construction.value.length,
          validCoordinateCount: construction.value.filter((item) => constructionPoints(item).length > 0).length,
          blockedCount: construction.value.filter((item) => item.properties?.IsBlock === '是').length,
          cacheMinutes: 10,
        }
      : { reachable: false, error: construction.reason instanceof Error ? construction.reason.message : String(construction.reason) },
  }
}

/** 在 Google 預設路線中段附近找可用來 shaping 的無障礙設施點。 */
export async function findWheelchairWaypoints(encodedPolyline: string, limit = 2): Promise<Point[]> {
  const route = decodePolyline(encodedPolyline)
  const midpoint = route[Math.floor(route.length / 2)]
  if (!midpoint) return []
  const facilities = await getWheelFacilities()
  const candidates = facilities
    .filter((item) => item.kind === '1' || item.kind === '7' || item.kind === '11')
    .flatMap((item) => facilityPoints(item).slice(0, 1))
    .map((point) => ({ point, midpointDistance: distanceMeters(point, midpoint), currentRouteDistance: routeDistance(point, route) }))
    // 太靠近原路線不會產生新 geometry；太遠則會製造不合理繞路。
    .filter(({ midpointDistance, currentRouteDistance }) => midpointDistance <= 500 && currentRouteDistance >= 35)
    .sort((a, b) => a.midpointDistance - b.midpointDistance)
  const selected: Point[] = []
  for (const candidate of candidates) {
    if (selected.every((point) => distanceMeters(point, candidate.point) >= 80)) selected.push(candidate.point)
    if (selected.length >= limit) break
  }
  return selected
}

/** 在封阻點兩側產生 pass-through waypoint，交由 Google 吸附到可步行道路。 */
export function findSafetyWaypoints(assessment: RouteAssessment, encodedPolyline: string): Point[] {
  const hazard = assessment.blockedConstruction?.point
  const route = decodePolyline(encodedPolyline)
  if (!hazard || route.length < 2) return []
  let nearestIndex = 1
  let nearestDistance = Infinity
  for (let i = 1; i < route.length; i++) {
    const distance = distanceMeters(hazard, route[i]!)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = i
    }
  }
  const before = route[nearestIndex - 1]!
  const after = route[nearestIndex]!
  const dx = (after.lng - before.lng) * Math.cos(hazard.lat * Math.PI / 180)
  const dy = after.lat - before.lat
  const length = Math.hypot(dx, dy) || 1
  const offsetLat = (dx / length) * (90 / 110540)
  const offsetLng = (-dy / length) * (90 / (111320 * Math.cos(hazard.lat * Math.PI / 180)))
  return [
    { lat: hazard.lat + offsetLat, lng: hazard.lng + offsetLng },
    { lat: hazard.lat - offsetLat, lng: hazard.lng - offsetLng },
  ]
}

export interface RoutePreferences {
  wheelchair: boolean
  safety: boolean
}

/**
 * 依使用者選的 Wheelchair / Safety 篩選器調整權重，決定哪條路線當 recommended。
 * Distance/Time 30%、Accessibility 30%（Wheelchair 開啟時 50%）、
 * Construction Safety 20%（Safety 開啟時 40%）、Comfort 10%（目前無涼適點資料源，先給中性分數）。
 */
export function scoreForRanking(
  route: { durationMinutes: number; accessibilityScore?: number; safetyScore?: number },
  prefs: RoutePreferences,
): number {
  const weights = {
    time: 0.3,
    accessibility: prefs.wheelchair ? 0.5 : 0.3,
    safety: prefs.safety ? 0.4 : 0.2,
    comfort: 0.1,
  }
  const totalWeight = weights.time + weights.accessibility + weights.safety + weights.comfort
  const timeScore = Math.max(0, 100 - (route.durationMinutes / 60) * 100)
  const comfortScore = 60
  const raw =
    timeScore * weights.time +
    (route.accessibilityScore ?? 50) * weights.accessibility +
    (route.safetyScore ?? 100) * weights.safety +
    comfortScore * weights.comfort
  return raw / totalWeight
}

export async function assessRoute(encodedPolyline: string): Promise<RouteAssessment> {
  const route = decodePolyline(encodedPolyline)
  const routeBounds = route.reduce((bounds, point) => ({
    minLat: Math.min(bounds.minLat, point.lat),
    maxLat: Math.max(bounds.maxLat, point.lat),
    minLng: Math.min(bounds.minLng, point.lng),
    maxLng: Math.max(bounds.maxLng, point.lng),
  }), { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity })
  const insideRouteBounds = (point: Point, paddingMeters: number) => {
    const latPadding = paddingMeters / 110540
    const lngPadding = paddingMeters / (111320 * Math.cos(point.lat * Math.PI / 180))
    return point.lat >= routeBounds.minLat - latPadding && point.lat <= routeBounds.maxLat + latPadding
      && point.lng >= routeBounds.minLng - lngPadding && point.lng <= routeBounds.maxLng + lngPadding
  }
  const [facilities, constructions] = await Promise.all([getWheelFacilities(), getConstructions()])
  const facilityCounts: Record<string, number> = {}
  let knownWidths = 0
  let adequateWidths = 0
  let knownSlopes = 0
  let adequateSlopes = 0

  for (const facility of facilities) {
    const points = facilityPoints(facility)
    if (!points.some((point) => insideRouteBounds(point, 25) && routeDistance(point, route) <= 25)) continue
    const label = KIND_LABELS[facility.kind ?? ''] ?? '無障礙設施'
    facilityCounts[label] = (facilityCounts[label] ?? 0) + 1
    if (typeof facility.width === 'number' && facility.width > 0) {
      knownWidths++
      if (facility.width >= 1.2 || facility.width >= 120) adequateWidths++
    }
    if (typeof facility.slope === 'number' && facility.slope >= 0) {
      knownSlopes++
      if (facility.slope <= 8.33) adequateSlopes++
    }
  }

  let constructionCount = 0
  const constructionConflicts: RouteAssessment['constructionConflicts'] = []
  let safetyScore = 100
  let hardBarrier = false
  let blockedConstruction: RouteAssessment['blockedConstruction']
  const seenConstruction = new Set<string>()
  // 同一工程可有多筆通報；去重前先讓 IsBlock=是 取得優先權，不可被同案的非封阻記錄蓋掉。
  const prioritizedConstructions = [...constructions].sort((a, b) =>
    Number(b.properties?.IsBlock === '是') - Number(a.properties?.IsBlock === '是'),
  )
  for (const construction of prioritizedConstructions) {
    const nearPoint = constructionPoints(construction)
      .find((point) => insideRouteBounds(point, 35) && routeDistance(point, route) <= 35)
    if (!nearPoint) continue
    const constructionKey = `${construction.properties?.Ac_no ?? ''}|${construction.properties?.Addr ?? ''}`
    if (seenConstruction.has(constructionKey)) continue
    seenConstruction.add(constructionKey)
    constructionCount++
    const intersects = routeDistance(nearPoint, route) <= 15
    constructionConflicts.push({
      id: construction.properties?.Ac_no || `construction-${constructionCount}`,
      road: construction.properties?.Addr || '未提供路名',
      section: construction.properties?.Addr || '路線附近',
      until: construction.properties?.Ce_Da || '今日',
      severity: intersects && construction.properties?.IsBlock === '是' ? 'blocked' : 'narrowed',
      note: construction.properties?.WItem || (intersects ? '施工路線相交' : '施工區域在附近'),
    })
    if (intersects && construction.properties?.IsBlock === '是') {
      hardBarrier = true
      safetyScore = 0
      blockedConstruction ??= { point: nearPoint, address: construction.properties?.Addr }
    } else {
      safetyScore = Math.max(20, safetyScore - (intersects ? 25 : 10))
    }
  }

  const nearbyCount = Object.values(facilityCounts).reduce((sum, count) => sum + count, 0)
  const widthRatio = knownWidths ? adequateWidths / knownWidths : 0.5
  const slopeRatio = knownSlopes ? adequateSlopes / knownSlopes : 0.5
  // 使用對數密度避免市中心每條路線都輕易滿分，保留候選線間的辨識度。
  const kindCoverage = Object.keys(facilityCounts).length / Object.keys(KIND_LABELS).length
  const densityScore = Math.min(25, Math.log2(nearbyCount + 1) * 4.5)
  const accessibilityScore = Math.round(Math.min(
    100,
    30 + kindCoverage * 20 + densityScore + widthRatio * 15 + slopeRatio * 10,
  ))
  return { accessibilityScore, safetyScore, hardBarrier, facilityCounts, constructionCount, constructionConflicts, blockedConstruction }
}
