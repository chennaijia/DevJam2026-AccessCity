import { notifications } from '../../../utils/repo'
import { requireAppUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const id = getRouterParam(event, 'id')!

  const item = await notifications.get(id)
  if (!item || item.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
  }

  await notifications.update(id, { read: true })
  return { ok: true, id }
})
