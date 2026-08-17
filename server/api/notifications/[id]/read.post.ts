import { db } from '../../../utils/store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const item = db.notifications.find((n) => n.id === id)

  if (!item) throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
  item.read = true

  return { ok: true, id }
})
