import { db } from '../../utils/store'

export default defineEventHandler(() => {
  // TODO: 依照顧者選擇的成員回傳其進行中的行程；沒有行程時回 status: 'idle'
  return db.trip
})
