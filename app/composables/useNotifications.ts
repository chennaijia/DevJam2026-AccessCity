/**
 * 被照顧者端的通知：清單、未讀數量、已讀標記。
 * 與 navbar 的紅點共用同一份狀態。
 */
import type { AppNotification } from '#shared/types/accessity'

export function useNotifications() {
  const items = useState<AppNotification[]>('accessity:notifications', () => [])
  const loaded = useState<boolean>('accessity:notifications-loaded', () => false)

  async function load(force = false) {
    if (loaded.value && !force) return items.value
    // TODO: 串接後端 —— GET /api/notifications（正式版另外接推播）
    items.value = await api.getNotifications()
    loaded.value = true
    return items.value
  }

  const unread = computed(() => items.value.filter((n) => !n.read))

  async function markRead(id: string) {
    // TODO: 串接後端 —— POST /api/notifications/:id/read
    await api.markNotificationRead(id)
    items.value = items.value.map((n) => (n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    // TODO: 串接後端 —— POST /api/notifications/read-all
    await api.markAllNotificationsRead()
    items.value = items.value.map((n) => ({ ...n, read: true }))
  }

  return { items, unread, load, markRead, markAllRead }
}
