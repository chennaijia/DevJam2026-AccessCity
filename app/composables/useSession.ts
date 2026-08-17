/**
 * 使用者 session（demo 版：只放在記憶體 / useState）
 * TODO: 接真後端後改成讀 cookie 或 useUserSession，並在 middleware 擋未登入頁面
 */
import type { AccessNeed, Role, User } from '#shared/types/accessity'

export function useSession() {
  const user = useState<User | null>('accessity:user', () => null)

  /** 還沒走完新手流程（登入後由後端的 onboardingCompletedAt 決定） */
  const needsOnboarding = computed(() => !!user.value && !user.value.onboardingCompletedAt)

  const role = computed<Role>(() => user.value?.role ?? 'care-recipient')
  const isCaregiver = computed(() => role.value === 'caregiver')
  const isLoggedIn = computed(() => !!user.value)

  function setUser(next: User | null) {
    user.value = next
  }

  /** 取得登入者；沒有有效 session 時 /api/me 會回 401 */
  async function ensureUser() {
    if (!user.value) user.value = await api.getMe()
    return user.value
  }

  function setRole(next: Role) {
    if (user.value) user.value = { ...user.value, role: next }
  }

  function setNeeds(next: AccessNeed[]) {
    if (user.value) user.value = { ...user.value, needs: next }
  }

  async function logout() {
    // Firebase 與我們自己的 session cookie 都要清
    await useFirebaseAuth().signOutFirebase()
    await api.logout()
    user.value = null
  }

  /**
   * 登入後的落地頁：兩種角色都進 /home，
   * /home 內部再依角色顯示照顧者儀表板或被照顧者主頁。
   */
  const homePath = computed(() => '/home')

  /** 走完新手流程 */
  async function completeOnboarding() {
    setUser(await api.completeOnboarding())
  }

  /**
   * 登入後（或每次進站）該去哪一頁：
   * 新帳號從選身分開始，走完的人直接進主頁。
   */
  function nextPath() {
    if (!user.value) return '/login'
    return needsOnboarding.value ? '/onboarding/role' : homePath.value
  }

  return {
    user,
    needsOnboarding,
    completeOnboarding,
    nextPath,
    role,
    isCaregiver,
    isLoggedIn,
    homePath,
    ensureUser,
    setUser,
    setRole,
    setNeeds,
    logout,
  }
}
