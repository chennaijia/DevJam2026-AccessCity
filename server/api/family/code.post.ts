import { createFamilyFor, families, generateFamilyCode, members, users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/** 重新產生自己的連結代碼（只有被照顧者本人可以做） */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)

  if (user.role !== 'care-recipient') {
    throw createError({ statusCode: 403, statusMessage: '連結代碼由被照顧者本人管理' })
  }

  if (!user.familyId) {
    const created = await createFamilyFor(user)
    return { ...created, members: await members.list({ familyId: created.id }) }
  }

  const family = await families.get(user.familyId)
  if (!family) throw createError({ statusCode: 404, statusMessage: '找不到照護圈' })

  // 換新碼 = 舊碼立刻失效，之前拿到舊碼但還沒連結的人就進不來了
  const updated = await families.update(family.id, {
    code: generateFamilyCode(),
    codeExpiresInDays: 7,
    codeCreatedAt: new Date().toISOString(),
  })

  invalidateUserCache(user.id)
  await users.update(user.id, { familyCode: updated.code })

  return { ...updated, members: await members.list({ familyId: family.id }) }
})
