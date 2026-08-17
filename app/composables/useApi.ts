/**
 * =============================================================================
 * 前端 ↔ 後端 API 接口層
 * =============================================================================
 * 所有畫面都只透過這裡跟後端說話；後端資料存在 Firestore（server/utils/repo.ts）。
 *
 * 登入狀態放在 httpOnly 的 session cookie：
 *   - 瀏覽器端的 $fetch 會自動帶 cookie
 *   - SSR 要用 useRequestFetch() 才會把瀏覽器的 cookie 轉送給 /api/**
 * 401 代表 session 過期，由 app/middleware/session.global.ts 導回 /login。
 */
import type {
  AccessNeed,
  ApiOk,
  AppNotification,
  ConstructionZone,
  CareAlert,
  Family,
  Member,
  NotificationSettings,
  RequirementChip,
  Role,
  RouteOption,
  SavedPlace,
  Shelter,
  TodayNeedOption,
  Trip,
  TripRecord,
  User,
  WeeklyOverview,
} from '#shared/types/accessity'

function request<T>(url: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  // 登入狀態放在 httpOnly cookie：
  // SSR 時要用 useRequestFetch() 才會把瀏覽器的 cookie 一起帶去給 /api/**，
  // 瀏覽器端的 $fetch 本來就會帶 cookie。
  const fetcher = import.meta.server ? useRequestFetch() : $fetch
  return fetcher<T>(url, { baseURL: '/api', ...options }) as Promise<T>
}

export const api = {
  /* ---------------------------------------------------------------- 帳號 */

  /** Google 登入：前端拿到 Firebase idToken 後交給後端驗證並建立 session */
  async loginWithFirebase(idToken: string): Promise<User> {
    return request<User>('/auth/firebase', { method: 'POST', body: { idToken } })
  },

  /** Demo 登入：沒有 Firebase 金鑰時也能把流程走完（POST /api/auth/demo） */
  async demoLogin(role: Role = 'care-recipient'): Promise<User> {
    return request<User>('/auth/demo', { method: 'POST', body: { role } })
  },

  async logout(): Promise<ApiOk> {
    // 清掉 session cookie
    return request('/auth/logout', { method: 'POST' })
  },

  async getMe(): Promise<User> {
    return request<User>('/me')
  },

  async updateRole(role: Role): Promise<User> {
    return request<User>('/me', { method: 'PATCH', body: { role } })
  },

  /** 標記新手流程完成（或明確跳過） */
  async completeOnboarding(): Promise<User> {
    return request<User>('/me/onboarding', { method: 'POST' })
  },

  /** 修改顯示名稱（家庭成員清單也會同步更新） */
  async updateProfileName(name: string): Promise<User> {
    return request<User>('/me', { method: 'PATCH', body: { name } })
  },

  async updateNeeds(needs: AccessNeed[]): Promise<User> {
    return request<User>('/me', { method: 'PATCH', body: { needs } })
  },

  /* ---------------------------------------------------------------- 家庭 */

  async getFamily(): Promise<Family> {
    return request<Family>('/family')
  },

  async regenerateFamilyCode(): Promise<Family> {
    return request<Family>('/family/code', { method: 'POST' })
  },

  /** 用家庭代碼加入；失敗時 reason 會說明原因 */
  async joinFamily(code: string): Promise<{
    ok: boolean
    reason: 'empty' | 'not-found' | 'expired' | null
    family: Family | null
  }> {
    return request('/family/join', { method: 'POST', body: { code } })
  },

  /** 被照顧者離開家庭 */
  async leaveFamily(): Promise<ApiOk> {
    return request('/family/leave', { method: 'POST' })
  },

  /** 照顧者把成員移出家庭 */
  async removeMember(memberId: string): Promise<ApiOk> {
    return request(`/family/members/${memberId}`, { method: 'DELETE' })
  },

  async acceptInvite(inviteId: string): Promise<ApiOk> {
    return request(`/family/invites/${inviteId}/accept`, { method: 'POST' })
  },

  /* ------------------------------------------------------- 家人 / 成員狀態 */

  async getMembers(): Promise<Member[]> {
    // TODO: 位置目前存在成員文件上，等 POST /api/location 做完後改成即時值
    return request<Member[]>('/members')
  },

  async getMember(id: string): Promise<Member | undefined> {
    return request<Member>(`/members/${id}`)
  },

  async updateMemberSettings(id: string, patch: Partial<Member>): Promise<Member> {
    return request<Member>(`/members/${id}`, { method: 'PATCH', body: patch })
  },

  /* ---------------------------------------------------- 導航 / Requirement */

  async parseRequirement(text: string): Promise<RequirementChip[]> {
    return request<RequirementChip[]>('/agent/requirement', { method: 'POST', body: { text } })
  },

  async getRoutes(
    destination: string,
    needs: AccessNeed[] = [],
    todayNeeds: string[] = [],
    origin?: { lat: number; lng: number } | null,
    /** 測試用：直接用座標指定終點，避免地址 geocode 每次跳到不同的點，方便重現測試案例 */
    destCoords?: { lat: number; lng: number } | null,
    /** 使用者明確講出來的出發點（例如「從政大到動物園」），有值就取代目前定位當起點 */
    originText?: string,
  ): Promise<RouteOption[]> {
    // TODO: 串接後端 —— GET /api/routes?destination=&needs=&today=
    //       後端負責呼叫 Google Routes API + 施工／無障礙資料，回傳排序後的路線。
    //       needs = 固定需求（輪椅/視障…），today = 今日需求（腳痠、想避開施工…）
    if (!USE_MOCK)
      return request<RouteOption[]>('/routes', {
        query: {
          destination,
          needs: needs.join(','),
          today: todayNeeds.join(','),
          ...(origin ? { originLat: origin.lat, originLng: origin.lng } : {}),
          ...(destCoords ? { destLat: destCoords.lat, destLng: destCoords.lng } : {}),
          ...(originText ? { origin: originText } : {}),
        },
      })
    return mock(mockRoutes, 400)
    return request<RouteOption[]>('/routes', {
      query: {
        destination,
        needs: needs.join(','),
        today: todayNeeds.join(','),
        ...(origin ? { originLat: origin.lat, originLng: origin.lng } : {}),
      },
    })
  },

  async getConstruction(): Promise<ConstructionZone[]> {
    return request<ConstructionZone[]>('/construction')
  },

  async getShelters(): Promise<Shelter[]> {
    // TODO: 後端仍回固定清單，之後換成真實避難所資料並依座標排序
    return request<Shelter[]>('/shelters')
  },

  /* ------------------------------------------- 首頁：常用地點 / 今日需求 */

  async getSavedPlaces(): Promise<SavedPlace[]> {
    return request<SavedPlace[]>('/places')
  },

  async addSavedPlace(payload: { label: string; address: string; icon?: SavedPlace['icon'] }): Promise<SavedPlace> {
    if (!USE_MOCK) return request<SavedPlace>('/places', { method: 'POST', body: payload })
    return mock({ id: `p_${Date.now()}`, icon: 'pin', ...payload })
  },

  async updateSavedPlace(id: string, patch: Partial<SavedPlace>): Promise<SavedPlace> {
    if (!USE_MOCK) return request<SavedPlace>(`/places/${id}`, { method: 'PATCH', body: patch })
    const target = mockSavedPlaces.find((p) => p.id === id)!
    return mock({ ...target, ...patch })
  },

  async deleteSavedPlace(id: string): Promise<ApiOk> {
    if (!USE_MOCK) return request(`/places/${id}`, { method: 'DELETE' })
    return mock({ ok: true } as ApiOk)
  },

  async getTodayNeedOptions(): Promise<TodayNeedOption[]> {
    return request<TodayNeedOption[]>('/needs/today')
  },

  async saveTodayNeeds(keys: string[]): Promise<ApiOk> {
    return request('/needs/today', { method: 'PATCH', body: { keys } })
  },

  async getRecentTrips(): Promise<TripRecord[]> {
    return request<TripRecord[]>('/trips/recent')
  },

  /* ------------------------------------------------------------ 行程 Trip */

  /** 進行中的行程；沒有行程時後端回 404，呼叫端要自己 catch */
  async getCurrentTrip(): Promise<Trip> {
    return request<Trip>('/trips/current')
  },

  async getWeeklyOverview(): Promise<WeeklyOverview> {
    return request<WeeklyOverview>('/trips/overview')
  },

  async startTrip(destination: string, routeId: string): Promise<Trip> {
    // TODO: 串接後端 —— POST /api/trips { destination, routeId }，並開始上傳位置
    return request<Trip>('/trips', { method: 'POST', body: { destination, routeId } })
  },

  async endTrip(tripId: string): Promise<ApiOk> {
    return request(`/trips/${tripId}/end`, { method: 'POST' })
  },

  /* --------------------------------------------------- 安全提醒 / Check-in */

  async getAlerts(): Promise<CareAlert[]> {
    // TODO: 正式版改推播 / SSE，不要靠頁面重新整理
    return request<CareAlert[]>('/alerts')
  },

  async sendSos(): Promise<CareAlert> {
    return request<CareAlert>('/alerts/sos', { method: 'POST' })
  },

  async respondAlert(id: string, action: 'responding' | 'received'): Promise<ApiOk> {
    return request(`/alerts/${id}/respond`, { method: 'POST', body: { action } })
  },

  async checkIn(answer: 'ok' | 'need-help' | 'no-response'): Promise<ApiOk> {
    return request('/checkin', { method: 'POST', body: { answer } })
  },

  async reportIssue(payload: { type: string; note: string }): Promise<ApiOk> {
    // TODO: 加上座標與照片上傳（Firebase Storage）
    // TODO: 串接後端 —— POST /api/reports（使用者回報障礙物 / 施工）
    return request('/reports', { method: 'POST', body: payload })
  },

  /* ---------------------------------------------------------- Web Push */

  /** 記住這台裝置，之後 Care Alert 會推播過來 */
  async registerPushToken(token: string): Promise<{ ok: boolean; devices: number }> {
    return request('/push/register', { method: 'POST', body: { token } })
  },

  async unregisterPushToken(token: string): Promise<{ ok: boolean; devices: number }> {
    return request('/push/unregister', { method: 'POST', body: { token } })
  },

  /** 讓使用者確認通知真的送得到 */
  async sendTestPush(): Promise<{ ok: boolean; sent: number }> {
    return request('/push/test', { method: 'POST' })
  },

  /* -------------------------------------------------------------- 通知 */

  async getNotifications(): Promise<AppNotification[]> {
    return request<AppNotification[]>('/notifications')
  },

  async markNotificationRead(id: string): Promise<ApiOk> {
    return request(`/notifications/${id}/read`, { method: 'POST' })
  },

  async markAllNotificationsRead(): Promise<ApiOk> {
    return request('/notifications/read-all', { method: 'POST' })
  },

  /* ------------------------------------------------------------ 通知設定 */

  async getNotificationSettings(): Promise<NotificationSettings> {
    return request<NotificationSettings>('/settings/notifications')
  },

  async updateNotificationSettings(
    patch: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    return request<NotificationSettings>('/settings/notifications', {
      method: 'PATCH',
      body: patch,
    })
  },
}

export function useApi() {
  return api
}
