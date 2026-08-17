import { families, isCodeExpired, members, users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/**
 * 照顧者用被照顧者給的代碼建立連結。
 * 一位照顧者可以連結多位家人，所以是往 familyIds 累加。
 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const { code } = await readBody<{ code: string }>(event)

  if (user.role !== 'caregiver') {
    throw createError({ statusCode: 403, statusMessage: '請用照顧者身分連結家人' })
  }

  const normalized = (code ?? '').trim().toUpperCase()
  if (!normalized) return { ok: false, reason: 'empty' as const, family: null }

  const target = (await families.list()).find((f) => f.code.toUpperCase() === normalized)
  if (!target) return { ok: false, reason: 'not-found' as const, family: null }
  if (isCodeExpired(target)) return { ok: false, reason: 'expired' as const, family: null }

  const familyIds = new Set(user.familyIds ?? (user.familyId ? [user.familyId] : []))
  if (familyIds.has(target.id)) {
    return {
      ok: true,
      reason: 'already' as const,
      family: { ...target, members: await members.list({ familyId: target.id }) },
    }
  }
  familyIds.add(target.id)

  invalidateUserCache(user.id)
  await users.update(user.id, {
    familyIds: [...familyIds],
    // 主要照護圈設成第一個，畫面預設看這一個
    familyId: user.familyId ?? target.id,
    // familyCode 是被照顧者自己的分享碼；照顧者只保存可存取的 familyIds。
    familyCode: null,
  })

  // 讓被照顧者知道自己被誰照顧著
  const owner = target.ownerId ? await users.get(target.ownerId) : null
  if (owner) {
    invalidateUserCache(owner.id)
    await users.update(owner.id, { connectedCaregiver: { id: user.id, name: user.name } })
  }

  return {
    ok: true,
    reason: null,
    family: { ...target, members: await members.list({ familyId: target.id }) },
  }
})
