/**
 * 一趟行程的規劃狀態：目的地 → AI 解析出的需求 chips → 選定路線 → 導航中。
 * todayNeeds 是「今天才有效」的暫時需求（企劃書 §4.2），會一起送進路線規劃。
 */
import type { RequirementChip, RouteOption } from '#shared/types/accessity'

export function usePlanning() {
  const destination = useState<string>('accessity:destination', () => '')
  const chips = useState<RequirementChip[]>('accessity:chips', () => [])
  const routes = useState<RouteOption[]>('accessity:routes', () => [])
  const selectedRouteId = useState<string>('accessity:selected-route', () => '')
  const todayNeeds = useState<string[]>('accessity:today-needs', () => [])
  const origin = useState<{ lat: number; lng: number } | null>('accessity:route-origin', () => null)

  const selectedRoute = computed(
    () => routes.value.find((r) => r.id === selectedRouteId.value) ?? routes.value[1] ?? routes.value[0],
  )

  /** Mimo 解析出的 chips（除了 destination）要一起送進 /api/routes，不然「避開施工」之類的需求永遠到不了後端 */
  const chipNeeds = computed(() => chips.value.map((c) => c.key).filter((k) => k !== 'destination'))

  function toggleTodayNeed(key: string) {
    todayNeeds.value = todayNeeds.value.includes(key)
      ? todayNeeds.value.filter((k) => k !== key)
      : [...todayNeeds.value, key]
    // TODO: 串接後端 —— PATCH /api/needs/today（今日需求只在當天有效）
    api.saveTodayNeeds(todayNeeds.value)
  }

  /**
   * 從首頁／常用地點／最近紀錄帶著目的地進入規劃流程。
   * 目的地同時放到網址（?to=），重新整理或分享連結時不會遺失。
   */
  function planTo(place: string) {
    destination.value = place
    return navigateTo({ path: '/map/plan', query: place ? { to: place } : undefined })
  }

  function reset() {
    destination.value = ''
    chips.value = []
    routes.value = []
    selectedRouteId.value = ''
  }

  /** 在使用者操作後讀取一次起點；拒絕定位時由後端的預設起點接手。 */
  async function resolveOrigin() {
    if (origin.value || !import.meta.client || !navigator.geolocation) return origin.value
    origin.value = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
      )
    })
    return origin.value
  }

  return {
    destination,
    chips,
    chipNeeds,
    routes,
    selectedRouteId,
    selectedRoute,
    todayNeeds,
    origin,
    resolveOrigin,
    toggleTodayNeed,
    planTo,
    reset,
  }
}
