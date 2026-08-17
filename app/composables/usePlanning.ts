/**
 * 一趟行程的規劃狀態：目的地 → AI 解析出的需求 chips → 選定路線 → 導航中。
 */
import type { RequirementChip, RouteOption } from '#shared/types/accessity'

export function usePlanning() {
  const destination = useState<string>('accessity:destination', () => '')
  const chips = useState<RequirementChip[]>('accessity:chips', () => [])
  const routes = useState<RouteOption[]>('accessity:routes', () => [])
  const selectedRouteId = useState<string>('accessity:selected-route', () => '')

  const selectedRoute = computed(
    () => routes.value.find((r) => r.id === selectedRouteId.value) ?? routes.value[1] ?? routes.value[0],
  )

  function reset() {
    destination.value = ''
    chips.value = []
    routes.value = []
    selectedRouteId.value = ''
  }

  return { destination, chips, routes, selectedRouteId, selectedRoute, reset }
}
