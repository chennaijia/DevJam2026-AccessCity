import { alerts } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  if (!user.familyId) return []

  const list = await alerts.list({ familyId: user.familyId })
  return list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
})
