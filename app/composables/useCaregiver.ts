/**
 * 照顧者視角：家中成員清單 + 目前正在關注的成員。
 * 選到的成員會被記住，主頁、地圖、提醒都跟著切換，不會只固定看第一個人。
 */
import type { Member } from '#shared/types/accessity'

export function useCaregiver() {
  const members = useState<Member[]>('accessity:members', () => [])
  const selectedId = useState<string>('accessity:selected-member', () => '')

  async function load(force = false) {
    if (members.value.length && !force) return members.value
    // TODO: 串接後端 —— GET /api/members（正式版改成即時更新位置與狀態）
    members.value = await api.getMembers()
    if (!selectedId.value) selectedId.value = members.value[0]?.id ?? ''
    return members.value
  }

  const selected = computed(
    () => members.value.find((m) => m.id === selectedId.value) ?? members.value[0],
  )

  function select(id: string) {
    selectedId.value = id
  }

  return { members, selectedId, selected, load, select }
}
