import type { ConstructionZone } from '#shared/types/accessity'

/**
 * 城市道路施工資料（demo 版）。
 * TODO: 換成真的開放資料 —— 定時抓取市府施工 API / GeoJSON，
 *       並改用座標與路線 polyline 做空間交集（目前先用路段名稱比對）。
 */
export const constructionZones: ConstructionZone[] = [
  {
    id: 'c_main',
    road: '中山南路',
    section: '中山南路與仁愛路口',
    until: '8/25',
    severity: 'blocked',
    note: '人行道封閉，輪椅無法通行',
  },
  {
    id: 'c_elm',
    road: '林蔭大道',
    section: '林蔭大道靠近市立圖書館',
    until: '8/20',
    severity: 'narrowed',
    note: '施工圍籬佔用一半人行道',
  },
]

/** 找出這條路線會撞到的施工路段 */
export function findConflicts(segments: string[] = []): ConstructionZone[] {
  return constructionZones.filter((zone) =>
    segments.some((segment) => segment.toLowerCase().includes(zone.road.toLowerCase())),
  )
}
