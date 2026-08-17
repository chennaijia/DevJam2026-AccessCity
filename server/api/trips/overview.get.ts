import { db } from '../../utils/store'

export default defineEventHandler(() => {
  // TODO: 從行程紀錄彙總本週里程與安全抵達次數
  return db.overview
})
