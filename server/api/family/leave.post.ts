import { members, users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/** 被照顧者主動離開家庭：照顧者就再也看不到他的位置 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  if (!user.familyId) return { ok: true }

  const own = (await members.list({ familyId: user.familyId })).filter((m) => m.userId === user.id)
  await Promise.all(own.map((m) => members.remove(m.id)))

  invalidateUserCache(user.id)
  await users.update(user.id, { familyId: null, familyCode: null, connectedCaregiver: null })

  return { ok: true }
})
