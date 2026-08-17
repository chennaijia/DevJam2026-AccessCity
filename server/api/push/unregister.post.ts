import { users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/** 關閉這台裝置的通知 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const { token } = await readBody<{ token?: string }>(event)

  const tokens = (user.fcmTokens ?? []).filter((t) => t !== token)

  invalidateUserCache(user.id)
  await users.update(user.id, { fcmTokens: tokens })

  return { ok: true, devices: tokens.length }
})
