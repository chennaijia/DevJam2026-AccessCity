import { db } from '../utils/store'

export default defineEventHandler(() => {
  // TODO: 依使用者目前座標排序，並用即時災害資料判斷 reachable
  return db.shelters
})
