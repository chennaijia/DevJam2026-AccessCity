import { users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const { keys } = await readBody<{ keys: string[] }>(event)

  // TODO: 加上 expiresAt，隔天自動清空
  invalidateUserCache(user.id)
  const updated = await users.update(user.id, { todayNeeds: keys ?? [] })
  return { ok: true, keys: updated.todayNeeds }
})
