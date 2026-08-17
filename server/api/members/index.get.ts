import { familyIdsOf, members } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const ids = familyIdsOf(user)
  if (!ids.length) return []

  // 照顧者可能同時連結多位家人，把每個照護圈的成員合起來
  const lists = await Promise.all(ids.map((familyId) => members.list({ familyId })))
  return lists.flat().sort((a, b) => a.id.localeCompare(b.id))
})
