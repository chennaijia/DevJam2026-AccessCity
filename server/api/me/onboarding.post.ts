import { users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/**
 * 標記新手流程完成（或使用者明確跳過）。
 * 有了這個時間戳，就不用再靠「有沒有填需求」去猜是不是新使用者。
 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)

  invalidateUserCache(user.id)
  return await users.update(user.id, { onboardingCompletedAt: new Date().toISOString() })
})
