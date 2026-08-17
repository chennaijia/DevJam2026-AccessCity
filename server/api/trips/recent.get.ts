import { db } from '../../utils/store'

export default defineEventHandler(() => {
  // TODO: 只回傳目前使用者的行程，並支援分頁（?limit=&cursor=）
  return db.recentTrips
})
