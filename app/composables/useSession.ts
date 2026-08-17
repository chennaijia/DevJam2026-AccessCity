/**
 * 使用者 session（demo 版：只放在記憶體 / useState）
 * TODO: 接真後端後改成讀 cookie 或 useUserSession，並在 middleware 擋未登入頁面
 */
import type { AccessNeed, Role, User } from '#shared/types/accessity'

export function useSession() {
  const user = useState<User | null>('accessity:user', () => null)

  /**
   * 登入前在歡迎頁選的身分。
   * 因為 Google 登入會整頁跳轉，記憶體狀態會消失，所以放在 cookie，
   * 後端 /api/auth/google 的 callback 會讀它來設定新帳號的角色。
   */
  const pendingRole = useCookie<Role | null>('accessity_pending_role', {
    default: () => null,
    maxAge: 60 * 30,
    sameSite: 'lax',
    path: '/',
  })

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
    pendingRole.value = null
  }

  /**
   * 登入後的落地頁：兩種角色都進 /home，
   * /home 內部再依角色顯示照顧者儀表板或被照顧者主頁。
   */
  const homePath = computed(() => '/home')

  /** 套用歡迎頁選的身分（Demo 登入用；Google 登入是在後端 callback 直接套用） */
  async function applyPendingRole() {
    if (!pendingRole.value) return
    const next = pendingRole.value
    await api.updateRole(next)
    setRole(next)
    pendingRole.value = null
  }

  return {
    user,
    pendingRole,
    applyPendingRole,
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
