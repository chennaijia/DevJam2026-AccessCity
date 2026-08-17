/**
 * 提醒（Care Alert）狀態：清單、未處理數量、回覆後即時反映。
 * 放在 session state 是為了讓 navbar 紅點、主頁「需要注意」、提醒詳情共用同一份資料，
 * 回覆之後三個地方會一起更新。
 */
import type { CareAlert } from '#shared/types/accessity'

export function useAlerts() {
  const alerts = useState<CareAlert[]>('accessity:alerts', () => [])
  const loaded = useState<boolean>('accessity:alerts-loaded', () => false)

  async function load(force = false) {
    if (loaded.value && !force) return alerts.value
    // TODO: 串接後端 —— GET /api/alerts（正式版改用推播 / SSE 主動推更新）
    alerts.value = await api.getAlerts()
    loaded.value = true
    return alerts.value
  }

  const pending = computed(() => alerts.value.filter((a) => !a.acknowledged))

  function byId(id: string) {
    return alerts.value.find((a) => a.id === id)
  }

  function respond(id: string, action: 'responding' | 'received') {
    const previous = alerts.value
    alerts.value = alerts.value.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    runInBackground(api.respondAlert(id, action), {
      label: 'alerts:respond',
      onError: () => (alerts.value = previous),
    })
  }

  return { alerts, pending, load, byId, respond }
}
