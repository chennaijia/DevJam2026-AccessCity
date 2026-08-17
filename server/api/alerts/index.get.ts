import { db } from '../../utils/store'

export default defineEventHandler(() => {
  // TODO: 只回傳這位照顧者相關、且未處理的提醒；正式版建議改 SSE / 推播
  return db.alerts
})
