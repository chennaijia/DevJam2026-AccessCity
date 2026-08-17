/**
 * 進到需要登入的頁面時，確保 session 裡有使用者。
 * 沒有這一層的話，沒自己呼叫 ensureUser() 的頁面會拿不到角色，
 * BottomNav 就會顯示成錯誤的身分（Profile 分頁不會亮、提醒紅點也不會出現）。
 *
 * TODO: 接真後端後改成 —— 沒有 token 就 navigateTo('/login')，有 token 才 GET /api/me
 */
const PUBLIC_PATHS = ['/', '/login', '/signup', '/onboarding/welcome']

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_PATHS.includes(to.path)) return

  const { isLoggedIn, ensureUser } = useSession()
  if (!isLoggedIn.value) await ensureUser()
})
