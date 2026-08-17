import { ensureUserSeed, settings } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  await ensureUserSeed(user.id)

  const doc = await settings.get(user.id)
  if (!doc) throw createError({ statusCode: 404, statusMessage: '找不到通知設定' })
  return doc
})
