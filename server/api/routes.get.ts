import type { RouteOption, RouteStep } from '#shared/types/accessity'
import { checkRouteAccessibilityCoverage, findNearbyAmenities, findRouteAccessibilityFacilities } from '../utils/wheelroute'
import { checkRouteConstructionConflicts, findBlockingHit } from '../utils/construction'
import { decodePolyline, destinationPoint } from '../utils/geo'
import { planRoutes } from '../utils/routePlanner'
import { extractNearbyPlaceType, findNearestPlace } from '../utils/places'

interface GoogleRoute {
  distanceMeters?: number
  duration?: string
  description?: string
  polyline?: { encodedPolyline?: string }
  legs?: Array<{
    steps?: Array<{
      distanceMeters?: number
      navigationInstruction?: { instructions?: string }
    }>
  }>
}

interface GoogleRoutesResponse {
  routes?: GoogleRoute[]
}

function durationSeconds(duration = '0s') {
  return Number(duration.replace(/s$/, '')) || 0
}

function toRouteOption(
  route: GoogleRoute,
  index: number,
  hasAccessibilityNeed: boolean,
): RouteOption {
  const steps: RouteStep[] = (route.legs ?? []).flatMap((leg) =>
    (leg.steps ?? []).map((step) => ({
      instruction: step.navigationInstruction?.instructions || '繼續前進',
      distanceMeters: step.distanceMeters ?? 0,
    })),
  )
  const recommended = index === 0

  return {
    id: `google-route-${index + 1}`,
    title: recommended ? 'Google 建議路線' : route.description || `替代路線 ${index + 1}`,
    badge: recommended ? 'recommended' : 'alternative',
    badgeLabel: recommended ? 'RECOMMENDED' : 'ALTERNATIVE',
    durationMinutes: Math.max(1, Math.ceil(durationSeconds(route.duration) / 60)),
    distanceMeters: route.distanceMeters,
    encodedPolyline: route.polyline?.encodedPolyline,
    tags: hasAccessibilityNeed ? ['Walking route', '請留意現場無障礙設施'] : ['Walking route'],
    reason: recommended ? '依 Google Routes API 的行人路線與預估時間推薦。' : undefined,
    steps,
  }
}

/** 多個檢查都可能想寫理由，用附加的而不是互相覆蓋掉 */
function appendReason(option: RouteOption, text: string) {
  option.reason = option.reason ? `${option.reason} ${text}` : text
}

/**
 * 用「輪行台北」的資料判斷這條路線走不走得通、沿途/目的地附近有什麼無障礙相關設施：
 * - 走不走得通：斜坡道 + 捷運站/公園無障礙出入口，沿路只要有一段查無這些點，就視為不利於輪椅通行
 * - 附加資訊：目的地附近的無障礙廁所、捷運站、公車站、友善店家（純資訊，不影響 badge）
 * 只涵蓋台北市，範圍外查不到資料就不判斷（維持原本的 badge）。
 */
async function applyAccessibilityCheck(option: RouteOption): Promise<RouteOption> {
  option.accessibilityFacilities = await findRouteAccessibilityFacilities(option.encodedPolyline)
  const coverage = await checkRouteAccessibilityCoverage(option.encodedPolyline)
  if (coverage.checked) {
    option.accessibilityScore = Math.round(coverage.coverage * 100)
    if (coverage.missingCount > 0) {
      option.badge = 'not-recommended'
      option.badgeLabel = 'NOT RECOMMENDED'
      appendReason(option, `沿途 ${coverage.missingCount} 處查無已知無障礙通行點資料，可能不利於輪椅通行。`)
      option.tags = [...option.tags, '⚠️ 部分路段缺乏無障礙通行點資料']
    } else {
      option.tags = [...option.tags, '✅ 沿途皆有已知無障礙通行點']
    }
  }

  const points = decodePolyline(option.encodedPolyline ?? '')
  const routeEndPoint = points.at(-1)
  if (routeEndPoint) {
    const [lat, lon] = routeEndPoint
    const amenities = await findNearbyAmenities(lat, lon)
    if (amenities.restroom) option.tags.push(`🚻 附近有無障礙廁所（${amenities.restroom.distanceMeters}m）`)
    if (amenities.mrtStation) option.tags.push(`🚇 鄰近${amenities.mrtStation.name}`)
    if (amenities.busStop) option.tags.push(`🚌 鄰近公車站`)
    if (amenities.friendlyStore) option.tags.push(`🏪 附近有友善店家`)
  }

  return option
}

/**
 * 用台北市「今日施工資訊」判斷這條路線有沒有撞到施工路段：
 * 完全封閉（IsBlock=是）的路段 → 標成 not-recommended；只是縮減通行的 → 只加提示標籤，不降級。
 */
async function applyConstructionCheck(option: RouteOption): Promise<RouteOption> {
  const conflicts = await checkRouteConstructionConflicts(option.encodedPolyline)
  if (!conflicts.length) return option

  option.constructionConflicts = conflicts
  const blocking = conflicts.filter((c) => c.severity === 'blocked')
  if (blocking.length > 0) {
    option.badge = 'not-recommended'
    option.badgeLabel = 'NOT RECOMMENDED'
    appendReason(
      option,
      `沿途有 ${blocking.length} 處施工完全封閉（${blocking[0]?.section}），無法通行。`,
    )
    option.tags = [...option.tags, '🚧 沿途有施工封閉路段']
  } else {
    option.tags = [...option.tags, '🚧 沿途有施工（未封閉，請留意）']
  }

  return option
}

type GoogleOrigin = { location: { latLng: { latitude: number; longitude: number } } } | { address: string }

async function callGoogleRoutes(
  apiKey: string,
  origin: GoogleOrigin,
  destination: GoogleOrigin,
  intermediate?: [number, number],
): Promise<GoogleRoute[]> {
  const response = await $fetch<GoogleRoutesResponse>(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'routes.distanceMeters',
          'routes.duration',
          'routes.description',
          'routes.polyline.encodedPolyline',
          'routes.legs.steps.distanceMeters',
          'routes.legs.steps.navigationInstruction.instructions',
        ].join(','),
      },
      body: {
        origin,
        destination,
        ...(intermediate
          ? { intermediates: [{ location: { latLng: { latitude: intermediate[0], longitude: intermediate[1] } } }] }
          : {}),
        travelMode: 'WALK',
        computeAlternativeRoutes: true,
        languageCode: 'zh-TW',
        units: 'METRIC',
      },
    },
  )
  return response.routes ?? []
}

/**
 * 路線被完全封閉的施工路段擋住時，在障礙點東西南北、不同距離處試著放一個「必須經過」的中繼點，
 * 逼 Google 重新規劃一條路。長施工區（例如捷運潛盾工程可能長達幾百公尺）光繞一個點不夠，
 * 所以不要求「完全零衝突」才採用——只要比原本的封閉衝突數量少，就是真的有改善，全部試完後選最好的一個。
 */
async function tryDetour(
  apiKey: string,
  origin: GoogleOrigin,
  destinationTarget: GoogleOrigin,
  option: RouteOption,
): Promise<RouteOption | null> {
  const hit = await findBlockingHit(option.encodedPolyline)
  if (!hit) return null

  const originalBlockingCount =
    option.constructionConflicts?.filter((c) => c.severity === 'blocked').length ?? 1
  console.log(
    `[detour] 路線「${option.id}」在「${hit.zone.section}」被完全封閉擋住（${originalBlockingCount} 處），開始嘗試自動繞道…`,
  )

  // 8 個方向/距離組合平行試，不用一個個等，明顯縮短回應時間
  const attempts = [120, 300].flatMap((distance) => [0, 90, 180, 270].map((bearing) => ({ distance, bearing })))
  const results = await Promise.all(
    attempts.map(async ({ distance, bearing }) => {
      const waypoint = destinationPoint(hit.routePoint, bearing, distance)
      const detourRoutes = await callGoogleRoutes(apiKey, origin, destinationTarget, waypoint)
      if (!detourRoutes.length) return null

      const candidate = toRouteOption(detourRoutes[0]!, 0, true)
      const conflicts = await checkRouteConstructionConflicts(candidate.encodedPolyline)
      candidate.constructionConflicts = conflicts
      return { candidate, blockingCount: conflicts.filter((c) => c.severity === 'blocked').length }
    }),
  )

  const perfect = results.find((r) => r && r.blockingCount === 0)
  if (perfect) {
    console.log(`[detour] 結果：完全避開成功 ✅（試了 ${results.filter(Boolean).length}/${attempts.length} 個方向)`)
    perfect.candidate.id = `${option.id}-detour`
    perfect.candidate.title = '系統自動繞道路線'
    perfect.candidate.badge = 'recommended'
    perfect.candidate.badgeLabel = 'RECOMMENDED'
    perfect.candidate.tags = [...perfect.candidate.tags, '🔄 已自動繞開施工封閉路段']
    perfect.candidate.reason = `原路線在「${hit.zone.section}」遇到施工封閉，系統已自動規劃繞道路線，已完全避開封閉路段。`
    return perfect.candidate
  }

  let best: { candidate: RouteOption; blockingCount: number } | null = null
  for (const r of results) {
    if (r && r.blockingCount < originalBlockingCount && (!best || r.blockingCount < best.blockingCount)) {
      best = r
    }
  }
  if (!best) {
    console.log('[detour] 結果：8 個方向都試過了，沒有找到比原路線更好的繞法 ❌')
    return null
  }

  console.log(`[detour] 結果：部分改善 ⚠️（封閉衝突 ${originalBlockingCount} → ${best.blockingCount}）`)
  best.candidate.id = `${option.id}-detour`
  best.candidate.title = '系統自動繞道路線（部分改善）'
  best.candidate.badge = 'alternative'
  best.candidate.badgeLabel = 'ALTERNATIVE'
  best.candidate.tags = [...best.candidate.tags, '🔄 已嘗試繞道，仍有部分施工路段']
  best.candidate.reason = `原路線在「${hit.zone.section}」遇到施工封閉，系統已嘗試自動繞道，將封閉路段從 ${originalBlockingCount} 處減少到 ${best.blockingCount} 處，但施工範圍較大，無法完全避開。`
  return best.candidate
}

export default defineEventHandler(async (event): Promise<RouteOption[]> => {
  const query = getQuery(event) as Record<string, string | undefined>
  const destination = query.destination?.trim()
  if (!destination) throw createError({ statusCode: 400, statusMessage: '請提供目的地' })

  const config = useRuntimeConfig(event)
  if (!config.googleRoutesApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'GOOGLE_ROUTES_API_KEY 未設定' })
  }

  const lat = Number(query.originLat)
  const lng = Number(query.originLng)
  const hasCoordinates =
    query.originLat !== undefined &&
    query.originLng !== undefined &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  const fallbackOrigin = String(config.googleRoutesOrigin || '').trim()
  if (!hasCoordinates && !fallbackOrigin) {
    throw createError({
      statusCode: 400,
      statusMessage: '無法取得起點，請允許定位或設定 GOOGLE_ROUTES_ORIGIN',
    })
  }

  const origin: GoogleOrigin = hasCoordinates
    ? { location: { latLng: { latitude: lat, longitude: lng } } }
    : { address: fallbackOrigin }
  const apiKey = String(config.googleRoutesApiKey)

  // 開發/測試用：destLat+destLng 可以直接用座標指定終點，避免地址 geocode 每次跳到不同的點，方便重現測試
  const destLat = Number(query.destLat)
  const destLng = Number(query.destLng)
  const hasDestCoordinates =
    query.destLat !== undefined && query.destLng !== undefined && Number.isFinite(destLat) && Number.isFinite(destLng)
  let destinationTarget: GoogleOrigin = hasDestCoordinates
    ? { location: { latLng: { latitude: destLat, longitude: destLng } } }
    : { address: destination }

  // 「最近的 XX」不能直接拿去查地址（Google 找不到一個叫「最近的捷運站」的地方），
  // 要用 Places Nearby Search 從使用者座標找真正最近的那個地點
  let resolvedDestinationName: string | null = null
  if (!hasDestCoordinates && hasCoordinates) {
    const placeType = extractNearbyPlaceType(destination)
    if (placeType && config.googlePlacesApiKey) {
      const nearest = await findNearestPlace(placeType, { lat, lng }, String(config.googlePlacesApiKey))
      if (nearest) {
        destinationTarget = { location: { latLng: { latitude: nearest.lat, longitude: nearest.lng } } }
        resolvedDestinationName = nearest.name
      }
    }
  }

  try {
    const routes = await callGoogleRoutes(apiKey, origin, destinationTarget)
    if (!routes.length) throw createError({ statusCode: 404, statusMessage: '找不到可步行的路線' })

    const needs = `${query.needs ?? ''},${query.today ?? ''}`
    const hasAccessibilityNeed = /wheelchair|mobility/.test(needs)
    const hasConstructionNeed = /avoid-construction/.test(needs)
    const needsSpecialHandling = hasAccessibilityNeed || hasConstructionNeed
    const options = routes.map((route, index) => toRouteOption(route, index, needsSpecialHandling))

    // 讓使用者知道「最近的捷運站」實際上被定位到哪裡了，不是憑空生出一個地點
    if (resolvedDestinationName) {
      for (const option of options) option.tags = [`📍 已定位到「${resolvedDestinationName}」`, ...option.tags]
    }

    if (!needsSpecialHandling) return options

    let scored = options
    if (hasAccessibilityNeed) scored = await Promise.all(scored.map(applyAccessibilityCheck))
    if (hasConstructionNeed) scored = await Promise.all(scored.map(applyConstructionCheck))

    // 痛點是自主繞道，不是只有警示：完全封閉的路段要真的試著算一條繞開的路線出來。
    // 只針對「封閉衝突最少、最有機會繞成功」的那一條試，不用每條被擋的候選都試一輪，不然平行打太多 Google API 反而更慢。
    if (hasConstructionNeed) {
      const blockedOptions = scored
        .filter((r) => r.badge === 'not-recommended' && r.constructionConflicts?.some((c) => c.severity === 'blocked'))
        .sort(
          (a, b) =>
            (a.constructionConflicts?.filter((c) => c.severity === 'blocked').length ?? 0) -
            (b.constructionConflicts?.filter((c) => c.severity === 'blocked').length ?? 0),
        )
      const bestCandidate = blockedOptions[0]
      if (bestCandidate) {
        const detour = await tryDetour(apiKey, origin, destinationTarget, bestCandidate)
        if (detour) scored.push(detour)
      }
    }

    // 路線規劃 Agent：在算好的事實裡選一條 recommended、幫每條寫理由，兩條以上路線才需要它
    const needsSummary = [query.needs, query.today].filter(Boolean).join(', ')
    const plan = await planRoutes(
      scored.map((r) => ({
        id: r.id,
        durationMinutes: r.durationMinutes,
        distanceMeters: r.distanceMeters,
        accessibilityScore: r.accessibilityScore,
        badge: r.badge,
        tags: r.tags,
      })),
      needsSummary,
      config.geminiApiKey ? String(config.geminiApiKey) : undefined,
    )

    if (plan) {
      for (const option of scored) {
        // not-recommended 是硬規則判斷出來的安全性事實，Agent 不能覆蓋掉
        if (option.badge !== 'not-recommended') {
          option.badge = option.id === plan.recommendedRouteId ? 'recommended' : 'alternative'
          option.badgeLabel = option.badge === 'recommended' ? 'RECOMMENDED' : 'ALTERNATIVE'
        }
        const reason = plan.reasons[option.id]
        if (reason) option.reason = reason
      }
    }

    return scored
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('[routes] Google Routes API 呼叫失敗：', error)
    throw createError({
      statusCode: error?.response?.status || 502,
      statusMessage: error?.data?.error?.message || 'Google Routes API 暫時無法使用',
    })
  }
})
