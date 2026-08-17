import { db } from '../../utils/store'

export default defineEventHandler(() => {
  // TODO: 只回傳目前使用者的通知，並支援分頁
  return db.notifications
})
