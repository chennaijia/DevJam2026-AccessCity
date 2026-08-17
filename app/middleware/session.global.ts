/**
 * 需要登入的頁面：確認 session cookie 有效（GET /api/me），
 * 401 就導回 /login。順便讓 BottomNav 拿得到正確角色。
 */
const PUBLIC_PATHS = ['/', '/login', '/onboarding/welcome']

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_PATHS.includes(to.path)) return

  const { isLoggedIn, ensureUser } = useSession()
  if (isLoggedIn.value) return

  try {
    await ensureUser()
  } catch {
    // 沒登入或 session 過期
    return navigateTo('/login')
  }
})
