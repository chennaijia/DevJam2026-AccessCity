import type { NotificationSettings } from '#shared/types/accessity'
import { ensureUserSeed, settings } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  await ensureUserSeed(user.id)

  const body = await readBody<Partial<NotificationSettings>>(event)
  const current = await settings.get(user.id)
  if (!current) throw createError({ statusCode: 404, statusMessage: '找不到通知設定' })

  return await settings.update(user.id, {
    caregiver: { ...current.caregiver, ...body.caregiver },
    recipient: { ...current.recipient, ...body.recipient },
  })
})
