/**
 * 使用者 session（demo 版：只放在記憶體 / useState）
 * TODO: 接真後端後改成讀 cookie 或 useUserSession，並在 middleware 擋未登入頁面
 */
import type { AccessNeed, Role, User } from '#shared/types/accessity'

export function useSession() {
  const user = useState<User | null>('accessity:user', () => null)

  /** 登入前在歡迎頁選的身分，登入成功後才寫回使用者 */
  const pendingRole = useState<Role | null>('accessity:pending-role', () => null)

  const role = computed<Role>(() => user.value?.role ?? 'care-recipient')
  const isCaregiver = computed(() => role.value === 'caregiver')
  const isLoggedIn = computed(() => !!user.value)

  function setUser(next: User | null) {
    user.value = next
  }

  /** demo：直接進到中間頁面時，補一個目前登入者（正式版改為讀 token 後 GET /api/me） */
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

  function logout() {
    // TODO: 串接後端 —— POST /api/auth/logout，並清掉 token
    user.value = null
  }

  /**
   * 登入後的落地頁：兩種角色都進 /home，
   * /home 內部再依角色顯示照顧者儀表板或被照顧者主頁。
   */
  const homePath = computed(() => '/home')

  /** 套用歡迎頁選的身分（登入 / 註冊完成後呼叫） */
  async function applyPendingRole() {
    if (!pendingRole.value) return
    // TODO: 串接後端 —— PATCH /api/me { role }
    await api.updateRole(pendingRole.value)
    setRole(pendingRole.value)
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
