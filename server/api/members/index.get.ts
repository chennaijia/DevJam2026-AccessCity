import { members } from '../../utils/repo'
import { requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  // 只回傳自己家庭的成員；Firestore 不保證順序，這裡固定排序讓畫面穩定
  const list = await members.list({ familyId: await requireFamilyId(event) })
  return list.sort((a, b) => a.id.localeCompare(b.id))
})
