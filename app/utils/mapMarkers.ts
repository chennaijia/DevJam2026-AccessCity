/**
 * 把後端比對出來的施工路段轉成地圖上的吉祥物標點。
 * 路線頁與導航頁都會用到，資訊視窗的內容要一致，所以放在這裡共用。
 */
import type { ConstructionZone } from '#shared/types/accessity'

export interface ConstructionMarker {
  lat: number
  lng: number
  label: string
  title: string
  lines: string[]
  status: { text: string; tone: 'red' | 'grey' }
}

export function toConstructionMarkers(zones?: ConstructionZone[]): ConstructionMarker[] {
  // 沒比對到座標的施工案只能顯示在文字清單，地圖上放不了
  return (zones ?? [])
    .filter((zone) => zone.location)
    .map((zone) => ({
      lat: zone.location!.lat,
      lng: zone.location!.lng,
      label: zone.section,
      title: zone.section,
      lines: [
        zone.road && zone.road !== zone.section ? `路段：${zone.road}` : '',
        zone.note,
        `施工至 ${zone.until}`,
        zone.severity === 'blocked'
          ? '此路段完全封閉，無法通行。'
          : '此路段通行空間縮減，經過時請留意。',
      ],
      status:
        zone.severity === 'blocked'
          ? { text: '完全封閉', tone: 'red' as const }
          : { text: '通行縮減', tone: 'grey' as const },
    }))
}
