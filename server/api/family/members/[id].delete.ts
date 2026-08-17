import { members, users } from '../../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../../utils/session'

/** 照顧者把成員移出家庭 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const id = getRouterParam(event, 'id')!

  if (user.role !== 'caregiver') {
    throw createError({ statusCode: 403, statusMessage: '只有照顧者可以移除成員' })
  }

  const member = await members.get(id)
  if (!member || member.familyId !== user.familyId) {
    throw createError({ statusCode: 404, statusMessage: '找不到這位成員' })
  }

  await members.remove(id)

  // 對應的帳號也要脫離家庭
  if (member.userId) {
    invalidateUserCache(member.userId)
    await users.update(member.userId, { familyId: null, familyCode: null, connectedCaregiver: null })
  }

  return { ok: true, id }
})
