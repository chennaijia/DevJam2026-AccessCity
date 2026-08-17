import type { AccessNeed, Role } from '#shared/types/accessity'
import { members, users } from '../utils/repo'
import { invalidateUserCache, requireAppUser } from '../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const body = await readBody<{ role?: Role; needs?: AccessNeed[]; name?: string }>(event)

  const patch: Record<string, unknown> = {}
  if (body.role) patch.role = body.role
  if (body.needs) patch.needs = body.needs

  if (body.name !== undefined) {
    const name = body.name.trim()
    if (!name) throw createError({ statusCode: 400, statusMessage: '名字不能是空的' })
    if (name.length > 30) throw createError({ statusCode: 400, statusMessage: '名字請控制在 30 字以內' })

    patch.name = name
    // 標記成自訂，之後 Google 登入不會再蓋回去
    patch.nameCustomized = true
  }

  // Email 由 Google 帳號決定，不開放修改

  if (!Object.keys(patch).length) return user

  invalidateUserCache(user.id)
  const updated = await users.update(user.id, patch)

  // 家庭成員清單顯示的是 members 的資料，改名要一起同步，照顧者才看得到
  if (patch.name && updated.familyId) {
    const own = (await members.list({ familyId: updated.familyId })).filter(
      (m) => m.userId === updated.id,
    )
    await Promise.all(
      own.map((m) =>
        members.update(m.id, {
          name: updated.name,
          initial: updated.name.slice(0, 1).toUpperCase(),
        }),
      ),
    )
  }

  return updated
})
