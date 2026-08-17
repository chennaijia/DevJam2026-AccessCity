import type { NotificationSettings } from '#shared/types/accessity'
import { db } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<NotificationSettings>>(event)

  // TODO: 依登入者身分只允許改自己那一區塊的設定
  db.settings = {
    caregiver: { ...db.settings.caregiver, ...body.caregiver },
    recipient: { ...db.settings.recipient, ...body.recipient },
  }

  return db.settings
})
