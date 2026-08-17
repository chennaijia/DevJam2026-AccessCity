import { createFamilyFor, families, generateFamilyCode, members, users } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)

  if (!user.familyId) {
    const created = await createFamilyFor(user)
    return { ...created, members: [] }
  }

  const family = await families.get(user.familyId)
  if (!family) throw createError({ statusCode: 404, statusMessage: '找不到家庭' })

  // 只有建立家庭的人可以換代碼（種子家庭沒有 ownerId，就放行）
  if (family.ownerId && family.ownerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: '只有建立家庭的照顧者可以更換代碼' })
  }

  // 換新碼 = 舊碼立刻失效
  const updated = await families.update(family.id, {
    code: generateFamilyCode(),
    codeExpiresInDays: 7,
    codeCreatedAt: new Date().toISOString(),
  })

  await users.update(user.id, { familyCode: updated.code })

  return { ...updated, members: await members.list({ familyId: family.id }) }
})
