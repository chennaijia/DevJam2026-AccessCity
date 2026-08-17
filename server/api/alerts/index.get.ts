import { alerts, familyIdsOf } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const ids = familyIdsOf(user)
  if (!ids.length) return []

  const lists = await Promise.all(ids.map((familyId) => alerts.list({ familyId })))
  return lists.flat().sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
})
