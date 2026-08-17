import type { RouteOption, RouteStep } from '#shared/types/accessity'
import { checkRouteAccessibilityCoverage, findNearbyAmenities } from '../utils/wheelroute'
import { decodePolyline } from '../utils/geo'
import { planRoutes } from '../utils/routePlanner'

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

/**
 * 用「輪行台北」的資料判斷這條路線走不走得通、沿途/目的地附近有什麼無障礙相關設施：
 * - 走不走得通：斜坡道 + 捷運站/公園無障礙出入口，沿路只要有一段查無這些點，就視為不利於輪椅通行
 * - 附加資訊：目的地附近的無障礙廁所、捷運站、公車站、友善店家（純資訊，不影響 badge）
 * 只涵蓋台北市，範圍外查不到資料就不判斷（維持原本的 badge）。
 */
async function applyAccessibilityCheck(option: RouteOption): Promise<RouteOption> {
  const coverage = await checkRouteAccessibilityCoverage(option.encodedPolyline)
  if (coverage.checked) {
    option.accessibilityScore = Math.round(coverage.coverage * 100)
    if (coverage.missingCount > 0) {
      option.badge = 'not-recommended'
      option.badgeLabel = 'NOT RECOMMENDED'
      option.reason = `沿途 ${coverage.missingCount} 處查無已知無障礙通行點資料，可能不利於輪椅通行。`
      option.tags = [...option.tags, '⚠️ 部分路段缺乏無障礙通行點資料']
    } else {
      option.tags = [...option.tags, '✅ 沿途皆有已知無障礙通行點']
    }
  }

  const points = decodePolyline(option.encodedPolyline ?? '')
  const destinationPoint = points.at(-1)
  if (destinationPoint) {
    const [lat, lon] = destinationPoint
    const amenities = await findNearbyAmenities(lat, lon)
    if (amenities.restroom) option.tags.push(`🚻 附近有無障礙廁所（${amenities.restroom.distanceMeters}m）`)
    if (amenities.mrtStation) option.tags.push(`🚇 鄰近${amenities.mrtStation.name}`)
    if (amenities.busStop) option.tags.push(`🚌 鄰近公車站`)
    if (amenities.friendlyStore) option.tags.push(`🏪 附近有友善店家`)
  }

  return option
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

  const origin = hasCoordinates
    ? { location: { latLng: { latitude: lat, longitude: lng } } }
    : { address: fallbackOrigin }

  try {
    const response = await $fetch<GoogleRoutesResponse>(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'X-Goog-Api-Key': String(config.googleRoutesApiKey),
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
          destination: { address: destination },
          travelMode: 'WALK',
          computeAlternativeRoutes: true,
          languageCode: 'zh-TW',
          units: 'METRIC',
        },
      },
    )

    const routes = response.routes ?? []
    if (!routes.length) throw createError({ statusCode: 404, statusMessage: '找不到可步行的路線' })

    const needs = `${query.needs ?? ''},${query.today ?? ''}`
    const hasAccessibilityNeed = /wheelchair|mobility/.test(needs)
    const options = routes.map((route, index) => toRouteOption(route, index, hasAccessibilityNeed))

    if (!hasAccessibilityNeed) return options
    const scored = await Promise.all(options.map(applyAccessibilityCheck))

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
