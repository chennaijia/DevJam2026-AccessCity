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
  // 預設帶 wheelchair，對應首頁 Wheelchair 篩選器原本就預設勾選的樣子
  const todayNeeds = useState<string[]>('accessity:today-needs', () => ['wheelchair'])
  const origin = useState<{ lat: number; lng: number } | null>('accessity:route-origin', () => null)
  /** 使用者明確講出來的出發點（例如「從政大到動物園」的「政大」），有值就取代目前定位當起點 */
  const originPlace = useState<string>('accessity:origin-place', () => '')
  /** 測試用：開了就不送帳號設定裡的固定 needs（例如輪椅），只送這次對話解析出的 chips，方便單獨測某一項 */
  const ignoreProfileNeeds = useState<boolean>('accessity:ignore-profile-needs', () => false)
  /**
   * 地圖上的施工吉祥物 icon 開關（純顯示用，不影響後端的施工比對與繞道）。
   * 放在共用狀態，路線頁關掉之後導航頁也維持關閉。
   */
  const showConstructionIcons = useState<boolean>('accessity:show-construction-icons', () => true)

  const selectedRoute = computed(
    () => routes.value.find((r) => r.id === selectedRouteId.value) ?? routes.value[1] ?? routes.value[0],
  )

  /** Mimo 解析出的 chips（除了 destination/origin，那兩個是分開處理的）要一起送進 /api/routes */
  const chipNeeds = computed(() =>
    chips.value.map((c) => c.key).filter((k) => k !== 'destination' && k !== 'origin'),
  )

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
    originPlace.value = ''
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
    originPlace,
    ignoreProfileNeeds,
    showConstructionIcons,
    resolveOrigin,
    toggleTodayNeed,
    planTo,
    reset,
  }
}
