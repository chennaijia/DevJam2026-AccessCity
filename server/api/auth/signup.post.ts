import { db } from '../../utils/store'
import type { User } from '#shared/types/accessity'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; email: string; password: string }>(event)

  if (!body?.email || !body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'name and email are required' })
  }

  // TODO: 檢查 email 是否已註冊、雜湊密碼、寄出驗證信
  const user: User = {
    id: `u_${Date.now()}`,
    name: body.name,
    email: body.email,
    role: 'care-recipient',
    needs: [],
    familyCode: null,
    connectedCaregiver: null,
  }

  db.users.push(user)
  db.currentUserId = user.id
  return user
})
