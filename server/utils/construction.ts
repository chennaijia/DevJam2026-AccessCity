/**
 * 台北市「今日施工資訊」開放資料。
 * 座標是 TWD97 (EPSG:3826) 投影座標，不是經緯度，要先用 proj4 轉成 WGS84
 * 才能跟 Google Routes 回傳的 polyline（WGS84）比對。
 * 只有使用者需求包含「避開施工」時才會用到。
 */
import proj4 from 'proj4'
import { planLog } from './planLog'
import type { ConstructionZone } from '#shared/types/accessity'
import { haversineMeters, decodePolyline, samplePolyline } from './geo'

proj4.defs(
  'EPSG:3826',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
)

const SOURCE_URL = 'https://tpnco.blob.core.windows.net/blobfs/Todaywork.json'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 「今日」施工資料，快取比其他資料源短一點
const CONSTRUCTION_RADIUS_M = 25

interface RawFeature {
  properties: {
    Ac_no: string
    Addr?: string
    C_Name?: string
    Ce_Da?: string
    IsBlock?: string
    WItem?: string
    Positions?: unknown
  }
}

interface ConstructionSite {
  /** Ac_no（工程編號)——同一個編號常常拆成好幾筆 feature，回傳結果要用這個去重 */
  groupId: string
  points: [number, number][] // WGS84 [lat, lon]
  blocking: boolean
  section: string
  road: string
  until: string
  note: string
}

let cache: ConstructionSite[] | null = null
let cachedAt = 0

/** Positions 可能是 MultiLineString（3 層)或 MultiPolygon（4 層)，遞迴攤平抓出所有 [x, y] */
function flattenPositions(node: unknown, out: [number, number][] = []): [number, number][] {
  if (Array.isArray(node) && node.length === 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
    out.push([node[0], node[1]])
    return out
  }
  if (Array.isArray(node)) {
    for (const child of node) flattenPositions(child, out)
  }
  return out
}

/** 民國年 "115/07/27" → "2026/07/27" */
function formatMinguoDate(s?: string): string {
  const m = s?.match(/^(\d+)\/(\d{1,2})\/(\d{1,2})$/)
  if (!m) return s || '未知'
  return `${Number(m[1]) + 1911}/${m[2]}/${m[3]}`
}

let inFlight: Promise<ConstructionSite[]> | null = null

async function getConstructionSites(): Promise<ConstructionSite[]> {
  if (cache && Date.now() - cachedAt < CACHE_TTL_MS) return cache
  // 好幾條路線同時檢查時，快取還沒寫回去，大家都會覺得快取是空的——
  // 共用同一個 in-flight promise，不然會有好幾個請求同時重新抓一次 3.2MB 的資料
  if (inFlight) return inFlight

  inFlight = (async () => {
    planLog('construction', '呼叫台北市今日施工資訊 API…')
    // 這份資料開頭有 BOM，且要保留原始文字自己 parse，用 $fetch 內建的 JSON parse 會直接炸掉
    const raw = await $fetch<string>(SOURCE_URL, { responseType: 'text' })
    const json = JSON.parse(raw.replace(/^﻿/, '')) as { features: RawFeature[] }

    const sites = json.features
      .map((f): ConstructionSite | null => {
        const p = f.properties
        const rawPoints = flattenPositions(p.Positions)
        if (!rawPoints.length) return null

        const points: [number, number][] = rawPoints.map(([x, y]) => {
          const [lon, lat] = proj4('EPSG:3826', 'WGS84', [x, y])
          return [lat, lon]
        })

        return {
          groupId: p.Ac_no,
          points,
          blocking: p.IsBlock === '是',
          section: p.Addr || p.C_Name || '施工路段',
          road: p.C_Name || '',
          until: formatMinguoDate(p.Ce_Da),
          note: p.WItem ? `施工項目：${p.WItem}` : '道路施工',
        }
      })
      .filter((s): s is ConstructionSite => s !== null)

    cache = sites
    cachedAt = Date.now()
    planLog('construction', `抓到 ${sites.length} 筆施工案`)
    return sites
  })()

  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

/** 沿著路線取樣，找出附近 25 公尺內有哪些正在施工的路段 */
export async function checkRouteConstructionConflicts(encodedPolyline?: string): Promise<ConstructionZone[]> {
  if (!encodedPolyline) return []

  const routePoints = samplePolyline(decodePolyline(encodedPolyline))
  if (!routePoints.length) return []

  const sites = await getConstructionSites()
  // 同一個工程編號（groupId）可能拆成好幾筆 feature，只留一筆代表——如果其中有任何一段是完全封閉，優先保留那筆
  const matchedByGroup = new Map<string, { site: ConstructionSite; point: [number, number] }>()

  for (const site of sites) {
    // 順便記下離路線最近的那個施工點座標，地圖上的吉祥物 icon 才有位置可以放
    let nearestPoint: [number, number] | null = null
    let nearestDistance = Infinity
    for (const rp of routePoints) {
      for (const sp of site.points) {
        const d = haversineMeters(rp, sp)
        if (d <= CONSTRUCTION_RADIUS_M && d < nearestDistance) {
          nearestDistance = d
          nearestPoint = sp
        }
      }
    }
    if (!nearestPoint) continue

    const existing = matchedByGroup.get(site.groupId)
    if (!existing || (site.blocking && !existing.site.blocking)) {
      matchedByGroup.set(site.groupId, { site, point: nearestPoint })
    }
  }

  const result = [...matchedByGroup.values()].map(({ site, point }) => ({
    id: site.groupId,
    road: site.road,
    section: site.section,
    until: site.until,
    severity: site.blocking ? ('blocked' as const) : ('narrowed' as const),
    note: site.note,
    location: { lat: point[0], lng: point[1] },
  }))

  const blockedCount = result.filter((c) => c.severity === 'blocked').length
  planLog(
    'construction',
    result.length
      ? `路線比對結果：撞到 ${result.length} 個施工案（完全封閉 ${blockedCount} 個）`
      : '路線比對結果：沿途沒有撞到任何施工案',
  )

  return result
}

export interface BlockingHit {
  zone: ConstructionZone
  /** 路線上被擋住的那個點，用來算繞道中繼點的位置 */
  routePoint: [number, number]
}

/** 找出路線上第一個被完全封閉的施工路段擋住的地方，繞道邏輯要用這個點去算中繼點 */
export async function findBlockingHit(encodedPolyline?: string): Promise<BlockingHit | null> {
  if (!encodedPolyline) return null

  const routePoints = samplePolyline(decodePolyline(encodedPolyline))
  if (!routePoints.length) return null

  const sites = await getConstructionSites()

  for (const site of sites) {
    if (!site.blocking) continue
    for (const rp of routePoints) {
      const isNearby = site.points.some((sp) => haversineMeters(rp, sp) <= CONSTRUCTION_RADIUS_M)
      if (isNearby) {
        return {
          zone: {
            id: site.groupId,
            road: site.road,
            section: site.section,
            until: site.until,
            severity: 'blocked',
            note: site.note,
          },
          routePoint: rp,
        }
      }
    }
  }

  return null
}
