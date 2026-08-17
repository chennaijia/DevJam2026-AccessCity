/**
 * 台北市「輪行台北」開放資料（多個 kind，同一組 API，只是路徑最後的數字不同)。
 * 每一筆只有座標可靠（width/slope 幾乎都是無效值 -1)，所以都只拿來做「附近有沒有這個設施」的判斷。
 * 只涵蓋台北市 —— 範圍外一律視為「無資料」，不當作「沒有」。
 */
import { haversineMeters, decodePolyline, samplePolyline } from './geo'
import { collectPlanLine, planLog } from './planLog'

const BASE_URL = 'https://wheelroute.gov.taipei/wheelrouteApi/api/facility/Get'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

/** 走路可不可行看這兩種：斜坡道 + 捷運站/公園的無障礙出入口，兩者都算「已知可通行點」 */
const PASSABILITY_KINDS = [1, 7] as const

const AMENITY_KINDS = {
  restroom: 9, // 無障礙廁所
  mrtStation: 20, // 捷運站
  busStop: 18, // 公車站
  friendlyStore: 8, // 友善店家
} as const

const KIND_LABELS: Record<number, string> = {
  1: '斜坡道',
  7: '捷運站/公園無障礙出入口',
  9: '無障礙廁所',
  20: '捷運站',
  18: '公車站',
  8: '友善店家',
}

const ALL_KINDS = [...new Set<number>([...PASSABILITY_KINDS, ...Object.values(AMENITY_KINDS)])]
let fetchedCount = 0

/** 在同一行覆寫進度條，抓完最後一種資料才換行，避免洗版終端機 */
function renderProgress(kind: number, recordCount: number) {
  fetchedCount = Math.min(fetchedCount + 1, ALL_KINDS.length)
  const barLength = 20
  const filled = Math.round((fetchedCount / ALL_KINDS.length) * barLength)
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)
  const label = KIND_LABELS[kind] ?? `kind=${kind}`
  const line = `資料抓取中 [${bar}] ${fetchedCount}/${ALL_KINDS.length}｜${label} ${recordCount} 筆`

  // 終端機用單行覆寫避免洗版，畫面上則每一筆都留著讓使用者看得到進度
  process.stdout.write(`\r${`[wheelroute] ${line}`.padEnd(70)}`)
  collectPlanLine(line)

  if (fetchedCount >= ALL_KINDS.length) {
    process.stdout.write('\n')
    fetchedCount = 0
  }
}

interface RawFacility {
  kname: string
  lat: string
  lon: string
}

interface FacilityPoint {
  lat: number
  lon: number
  name: string
}

const cache = new Map<number, { points: FacilityPoint[]; cachedAt: number }>()
// 好幾條路線同時檢查時，快取還沒寫回去，大家都會覺得快取是空的——
// 用 in-flight promise 讓同一個 kind 的並行請求共用同一次抓取，不然會重複打好幾次 API
const inFlight = new Map<number, Promise<FacilityPoint[]>>()

async function getFacilities(kind: number): Promise<FacilityPoint[]> {
  const cached = cache.get(kind)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.points

  const pending = inFlight.get(kind)
  if (pending) return pending

  const fetchPromise = (async () => {
    const raw = await $fetch<RawFacility[]>(`${BASE_URL}/${kind}`)
    const points: FacilityPoint[] = raw
      .map((r) => ({
        lat: Number(r.lat),
        lon: Number(r.lon),
        name: r.kname?.split('-')[0]?.trim() || '',
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lat !== 0 && p.lon !== 0)

    cache.set(kind, { points, cachedAt: Date.now() })
    renderProgress(kind, points.length)
    return points
  })()

  inFlight.set(kind, fetchPromise)
  try {
    return await fetchPromise
  } finally {
    inFlight.delete(kind)
  }
}

/** 台北市大致範圍，超出這個範圍就不用這份資料判斷 */
function isInTaipei(lat: number, lon: number) {
  return lat >= 24.9 && lat <= 25.22 && lon >= 121.4 && lon <= 121.72
}

const PASSABILITY_RADIUS_M = 30

export interface AccessibilityCoverage {
  /** 這條路線在台北市範圍內、有取樣到點，才算真的檢查過 */
  checked: boolean
  /** 取樣點中，附近找得到已知無障礙通行點的比例（0~1） */
  coverage: number
  sampleCount: number
  missingCount: number
}

/** 沿著路線的 polyline 取樣，逐點判斷附近有沒有已知的斜坡道或無障礙出入口 */
export async function checkRouteAccessibilityCoverage(
  encodedPolyline?: string,
): Promise<AccessibilityCoverage> {
  const empty: AccessibilityCoverage = { checked: false, coverage: 0, sampleCount: 0, missingCount: 0 }
  if (!encodedPolyline) return empty

  const points = samplePolyline(decodePolyline(encodedPolyline))
  const inTaipei = points.filter(([lat, lon]) => isInTaipei(lat, lon))
  if (inTaipei.length === 0) return empty

  const passablePoints = (await Promise.all(PASSABILITY_KINDS.map(getFacilities))).flat()
  let missingCount = 0
  for (const point of inTaipei) {
    const hasNearbyPassage = passablePoints.some(
      (p) => haversineMeters(point, [p.lat, p.lon]) <= PASSABILITY_RADIUS_M,
    )
    if (!hasNearbyPassage) missingCount++
  }

  const coverage = (inTaipei.length - missingCount) / inTaipei.length
  planLog(
    'wheelroute',
    `路線比對結果：取樣 ${inTaipei.length} 點，缺無障礙通行點 ${missingCount} 點，覆蓋率 ${Math.round(coverage * 100)}%`,
  )

  return { checked: true, coverage, sampleCount: inTaipei.length, missingCount }
}

/** 沿路線取樣，找出附近的已知無障礙通行點（斜坡道/出入口），地圖上顯示吉祥物 icon 用 */
export async function findRouteAccessibilityFacilities(
  encodedPolyline?: string,
): Promise<{ lat: number; lng: number; name: string }[]> {
  if (!encodedPolyline) return []

  const points = samplePolyline(decodePolyline(encodedPolyline))
  const inTaipei = points.filter(([lat, lon]) => isInTaipei(lat, lon))
  if (inTaipei.length === 0) return []

  const passablePoints = (await Promise.all(PASSABILITY_KINDS.map(getFacilities))).flat()
  const nearby = new Map<string, { lat: number; lng: number; name: string }>()
  for (const point of inTaipei) {
    for (const p of passablePoints) {
      if (haversineMeters(point, [p.lat, p.lon]) <= PASSABILITY_RADIUS_M) {
        nearby.set(`${p.lat},${p.lon}`, { lat: p.lat, lng: p.lon, name: p.name || '無障礙通行點' })
      }
    }
  }
  return [...nearby.values()]
}

export interface NearbyFacility {
  name: string
  distanceMeters: number
}

async function findNearest(
  lat: number,
  lon: number,
  kind: number,
  radiusMeters: number,
): Promise<NearbyFacility | null> {
  const points = await getFacilities(kind)
  let nearest: NearbyFacility | null = null
  for (const p of points) {
    const distanceMeters = haversineMeters([lat, lon], [p.lat, p.lon])
    if (distanceMeters <= radiusMeters && (!nearest || distanceMeters < nearest.distanceMeters)) {
      nearest = { name: p.name || '（未命名地點）', distanceMeters: Math.round(distanceMeters) }
    }
  }
  return nearest
}

export interface NearbyAmenities {
  restroom: NearbyFacility | null
  mrtStation: NearbyFacility | null
  busStop: NearbyFacility | null
  friendlyStore: NearbyFacility | null
}

/** 目的地附近有哪些無障礙相關設施——只查目的地座標，不是整條路線 */
export async function findNearbyAmenities(lat: number, lon: number): Promise<NearbyAmenities> {
  const empty: NearbyAmenities = { restroom: null, mrtStation: null, busStop: null, friendlyStore: null }
  if (!isInTaipei(lat, lon)) return empty

  const [restroom, mrtStation, busStop, friendlyStore] = await Promise.all([
    findNearest(lat, lon, AMENITY_KINDS.restroom, 400),
    findNearest(lat, lon, AMENITY_KINDS.mrtStation, 600),
    findNearest(lat, lon, AMENITY_KINDS.busStop, 300),
    findNearest(lat, lon, AMENITY_KINDS.friendlyStore, 400),
  ])

  return { restroom, mrtStation, busStop, friendlyStore }
}
