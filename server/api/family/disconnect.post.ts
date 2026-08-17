import { families, users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/**
 * 解除連結：只有照顧者可以主動解除自己與某位家人的連結（body.familyId）。
 *
 * 被照顧者這端刻意不提供移除照顧者的功能——照護關係要斷開時由照顧者操作，
 * 避免在被照顧者端誤觸而失去求助管道；真的要換人時可以「重新產生代碼」，
 * 之後拿到舊代碼的人就連不進來。
 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const { familyId } = await readBody<{ familyId?: string }>(event)

  if (user.role !== 'caregiver') {
    throw createError({
      statusCode: 403,
      statusMessage: '照護關係請由照顧者端解除；你可以重新產生代碼來阻止新的連結',
    })
  }

  const target = familyId ?? user.familyId
  if (!target) return { ok: true }

  const rest = (user.familyIds ?? (user.familyId ? [user.familyId] : [])).filter(
    (id) => id !== target,
  )

  invalidateUserCache(user.id)
  await users.update(user.id, {
    familyIds: rest,
    familyId: rest[0] ?? null,
    familyCode: null,
  })

  // 對方的「已連結照顧者」也要清掉
  const family = await families.get(target)
  if (family?.ownerId) {
    const owner = await users.get(family.ownerId)
    if (owner?.connectedCaregiver?.id === user.id) {
      invalidateUserCache(owner.id)
      await users.update(owner.id, { connectedCaregiver: null })
    }
  }

  return { ok: true }
})
