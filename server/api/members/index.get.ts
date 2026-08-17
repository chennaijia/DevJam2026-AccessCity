import { members } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  if (!user.familyId) return []

  // Firestore 不保證順序，這裡固定排序讓畫面穩定
  const list = await members.list({ familyId: user.familyId })
  return list.sort((a, b) => a.id.localeCompare(b.id))
})
