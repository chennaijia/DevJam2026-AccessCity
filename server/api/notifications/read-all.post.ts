import { notifications } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const list = await notifications.list({ userId: user.id })

  await Promise.all(list.filter((n) => !n.read).map((n) => notifications.update(n.id, { read: true })))
  return { ok: true }
})
