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

  function markRead(id: string) {
    const previous = items.value
    items.value = items.value.map((n) => (n.id === id ? { ...n, read: true } : n))
    runInBackground(api.markNotificationRead(id), {
      label: 'notifications:mark-read',
      onError: () => (items.value = previous),
    })
  }

  function markAllRead() {
    const previous = items.value
    items.value = items.value.map((n) => ({ ...n, read: true }))
    runInBackground(api.markAllNotificationsRead(), {
      label: 'notifications:mark-all-read',
      onError: () => (items.value = previous),
    })
  }

  return { items, unread, load, markRead, markAllRead }
}
