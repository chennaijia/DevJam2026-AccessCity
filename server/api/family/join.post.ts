import { addMemberFor, families, isCodeExpired, members, users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/**
 * 用家庭代碼加入。
 * 除了更新使用者的 familyId，也會在 members 建立一筆，
 * 照顧者的 Dashboard 才看得到這個人（先前少了這一步）。
 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const { code } = await readBody<{ code: string }>(event)

  const normalized = (code ?? '').trim().toUpperCase()
  if (!normalized) return { ok: false, reason: 'empty' as const, family: null }

  const target = (await families.list()).find((f) => f.code.toUpperCase() === normalized)
  if (!target) return { ok: false, reason: 'not-found' as const, family: null }

  if (isCodeExpired(target)) {
    return { ok: false, reason: 'expired' as const, family: null }
  }

  // 已經在別的家庭裡的話，先把舊的成員資料移除
  if (user.familyId && user.familyId !== target.id) {
    const old = (await members.list({ familyId: user.familyId })).filter((m) => m.userId === user.id)
    await Promise.all(old.map((m) => members.remove(m.id)))
  }

  invalidateUserCache(user.id)
  const updated = await users.update(user.id, { familyId: target.id, familyCode: target.code })

  // 被照顧者才需要出現在成員清單；照顧者是看的人
  if (updated.role === 'care-recipient') await addMemberFor(updated, target.id)

  return {
    ok: true,
    reason: null,
    family: { ...target, members: await members.list({ familyId: target.id }) },
  }
})
