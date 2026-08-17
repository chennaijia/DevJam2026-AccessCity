import { getFirebaseAuth } from '../../utils/firebase'
import { upsertUser } from '../../utils/repo'
import { setAppSession } from '../../utils/session'
import type { Role } from '#shared/types/accessity'

/**
 * Firebase 登入：前端用 Firebase SDK 完成 Google 登入後，把 idToken 送過來，
 * 這裡用 Admin SDK 驗證，再建立我們自己的加密 session cookie。
 * 之後所有 /api/** 都靠這個 cookie，不需要在前端保存任何 token。
 */
export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken?: string }>(event)
  if (!idToken) throw createError({ statusCode: 400, statusMessage: '缺少 idToken' })

  const auth = getFirebaseAuth()
  if (!auth) {
    throw createError({ statusCode: 500, statusMessage: 'Firebase 服務帳戶尚未設定' })
  }

  let decoded
  try {
    decoded = await auth.verifyIdToken(idToken)
  } catch (error) {
    console.error('[auth/firebase] idToken 驗證失敗：', error)
    throw createError({ statusCode: 401, statusMessage: 'Google 登入驗證失敗' })
  }

  if (!decoded.email) {
    throw createError({ statusCode: 400, statusMessage: 'Google 帳號沒有提供 Email' })
  }

  const user = await upsertUser({
    id: decoded.uid,
    email: decoded.email,
    name: decoded.name as string | undefined,
    avatar: decoded.picture as string | undefined,
    provider: 'google',
  })

  // 登入前在歡迎頁選的身分（cookie 帶過來的）
  const pendingRole = getCookie(event, 'accessity_pending_role') as Role | undefined
  if (pendingRole === 'caregiver' || pendingRole === 'care-recipient') {
    Object.assign(user, await usersUpdateRole(user.id, pendingRole))
    deleteCookie(event, 'accessity_pending_role')
  }

  await setAppSession(event, user)
  return user
})

async function usersUpdateRole(id: string, role: Role) {
  const { users } = await import('../../utils/repo')
  return await users.update(id, { role })
}
