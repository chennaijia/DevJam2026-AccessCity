/**
 * 需要登入的頁面：確認 session cookie 有效（GET /api/me），401 就導回 /login。
 * 另外，登入了但還沒走完新手流程的人，一律先帶回流程裡，
 * 中途重新整理也不會掉出去。
 */
const PUBLIC_PATHS = ['/', '/login']

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_PATHS.includes(to.path)) return

  const { isLoggedIn, ensureUser, needsOnboarding } = useSession()

  if (!isLoggedIn.value) {
    try {
      await ensureUser()
    } catch {
      // 沒登入或 session 過期
      return navigateTo('/login')
    }
  }

  // 新手流程還沒走完 → 只能待在 /onboarding/**
  if (needsOnboarding.value && !to.path.startsWith('/onboarding')) {
    return navigateTo('/onboarding/role')
  }
})
