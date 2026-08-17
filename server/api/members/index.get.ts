import { db } from '../../utils/store'

export default defineEventHandler(() => {
  // TODO: 只回傳「與目前照顧者有連結」的成員；位置改讀最新的 location ping
  return db.members
})
