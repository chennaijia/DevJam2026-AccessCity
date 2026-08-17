import { alerts } from '../../utils/repo'
import { requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  // 只回傳自己家庭的提醒；TODO: 正式版改推播 / SSE 主動更新
  const list = await alerts.list({ familyId: await requireFamilyId(event) })
  return list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
})
