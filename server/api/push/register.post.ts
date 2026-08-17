import { users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/** 記住這台裝置的推播 token（同一帳號可能有手機 + 電腦） */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const { token } = await readBody<{ token?: string }>(event)

  if (!token) throw createError({ statusCode: 400, statusMessage: '缺少 token' })

  const tokens = new Set(user.fcmTokens ?? [])
  tokens.add(token)

  invalidateUserCache(user.id)
  await users.update(user.id, { fcmTokens: [...tokens] })

  return { ok: true, devices: tokens.size }
})
