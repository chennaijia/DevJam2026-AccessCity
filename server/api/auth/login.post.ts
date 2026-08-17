import { db } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const { email } = await readBody<{ email?: string; password?: string }>(event)

  // TODO: 驗證密碼（bcrypt）、發 JWT / session cookie、失敗回 401
  const user = db.users.find((u) => u.email === email) ?? db.users[0]!
  db.currentUserId = user.id
  return user
})
