import { db } from '../../utils/store'

export default defineEventHandler(() => {
  // TODO: 只有 caregiver 本人可以重新產生；舊碼要立即失效並記錄操作紀錄
  db.family.code = `AC-${Math.floor(10000 + Math.random() * 89999)}`
  db.family.codeExpiresInDays = 7
  return { ...db.family, members: db.members }
})
