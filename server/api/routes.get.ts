import type { RouteOption, RouteStep } from '#shared/types/accessity'

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
          computeAlternativeRoutes: false,
          languageCode: 'zh-TW',
          units: 'METRIC',
        },
      },
    )

    const routes = response.routes ?? []
    if (!routes.length) throw createError({ statusCode: 404, statusMessage: '找不到可步行的路線' })

    const needs = `${query.needs ?? ''},${query.today ?? ''}`
    return routes.map((route, index) =>
      toRouteOption(route, index, /wheelchair|mobility/.test(needs)),
    )
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('[routes] Google Routes API 呼叫失敗：', error)
    throw createError({
      statusCode: error?.response?.status || 502,
      statusMessage: error?.data?.error?.message || 'Google Routes API 暫時無法使用',
    })
  }
})
