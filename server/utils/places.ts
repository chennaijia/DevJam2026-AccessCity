/**
 * 「最近的 XX」這種相對地點查詢不能直接拿去查地址（Google 查不到一個叫「最近的捷運站」的地方），
 * 要用 Places API 的 Nearby Search，從使用者目前座標找真正最近的那個地點。
 */

const PLACE_TYPE_MAP: Record<string, string> = {
  捷運站: 'subway_station',
  捷運: 'subway_station',
  公車站: 'bus_station',
  公車: 'bus_station',
  醫院: 'hospital',
  超商: 'convenience_store',
  便利商店: 'convenience_store',
  藥局: 'pharmacy',
  藥房: 'pharmacy',
  公園: 'park',
  警察局: 'police',
  派出所: 'police',
  銀行: 'bank',
  提款機: 'atm',
  加油站: 'gas_station',
  餐廳: 'restaurant',
  咖啡廳: 'cafe',
  咖啡店: 'cafe',
  停車場: 'parking',
}

const NEAREST_PATTERN = /^(?:最近|附近)的?\s*(.+?)\s*$/

/** 判斷這句話是不是在問「最近的 XX」，是的話回傳對應的 Google Places 地點類型 */
export function extractNearbyPlaceType(text: string): string | null {
  const match = text.match(NEAREST_PATTERN)
  if (!match) return null
  const keyword = match[1] ?? ''
  for (const [zh, type] of Object.entries(PLACE_TYPE_MAP)) {
    if (keyword.includes(zh)) return type
  }
  return null
}

export interface ResolvedPlace {
  name: string
  lat: number
  lng: number
}

interface NearbySearchResponse {
  places?: {
    displayName?: { text?: string }
    location?: { latitude?: number; longitude?: number }
  }[]
}

/** 從使用者座標找真正最近的那個地點，找不到或 API 失敗就回傳 null（呼叫端會退回原本的地址查詢） */
export async function findNearestPlace(
  placeType: string,
  origin: { lat: number; lng: number },
  apiKey: string,
): Promise<ResolvedPlace | null> {
  try {
    const response = await $fetch<NearbySearchResponse>('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.location',
        'Content-Type': 'application/json',
      },
      body: {
        includedTypes: [placeType],
        maxResultCount: 1,
        rankPreference: 'DISTANCE',
        languageCode: 'zh-TW',
        locationRestriction: {
          circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius: 3000 },
        },
      },
    })

    const place = response.places?.[0]
    const lat = place?.location?.latitude
    const lng = place?.location?.longitude
    if (lat === undefined || lng === undefined) {
      console.log(`[places] 附近沒找到 type=${placeType} 的地點（3km 內)`)
      return null
    }

    const name = place?.displayName?.text ?? '最近的地點'
    console.log(`[places] Nearby Search 找到「${name}」（${placeType}）`)
    return { name, lat, lng }
  } catch (err) {
    console.error('[places] Nearby Search 失敗，退回原本的地址查詢：', err)
    return null
  }
}
