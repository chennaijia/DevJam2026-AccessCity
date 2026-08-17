import { db } from '../../utils/store'

export default defineEventHandler(() => {
  db.notifications = db.notifications.map((n) => ({ ...n, read: true }))
  return { ok: true }
})
