/**
 * =============================================================================
 * 前端 ↔ 後端 API 接口層
 * =============================================================================
 * 目前 `USE_MOCK = true`，所有畫面都吃 `#shared/mock/data.ts` 的模擬資料。
 *
 * 每個 method 裡都已經寫好對應的後端呼叫（server/api/... 已實作），
 * 只要把下面的 USE_MOCK 改成 false，整個 App 就會改走真實 API。
 * 各個 `// TODO:` 標註的是接真後端時需要補的事情（驗證、token、錯誤處理…）。
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
import {
  mockAlerts,
  mockCaregiver,
  mockFamily,
  mockMembers,
  mockNotificationSettings,
  mockNotifications,
  mockRecentTrips,
  mockRequirementChips,
  mockRoutes,
  mockSavedPlaces,
  mockShelters,
  mockTodayNeedOptions,
  mockTrip,
  mockUser,
  mockWeeklyOverview,
} from '#shared/mock/data'

/** TODO: 後端串接完成後改成 false（或改由 runtimeConfig.public 控制） */
const USE_MOCK = false

/** 模擬網路延遲，讓 loading 狀態在 demo 時看得出來 */
function mock<T>(data: T, delay = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), delay))
}

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
    if (!USE_MOCK) return request<User>('/auth/demo', { method: 'POST', body: { role } })
    return mock(role === 'caregiver' ? mockCaregiver : mockUser)
  },

  async logout(): Promise<ApiOk> {
    // 清掉 session cookie
    if (!USE_MOCK) return request('/auth/logout', { method: 'POST' })
    return mock({ ok: true } as ApiOk)
  },

  async getMe(): Promise<User> {
    // TODO: 串接後端 —— GET /api/me（需要 token）
    if (!USE_MOCK) return request<User>('/me')
    return mock(mockUser)
  },

  async updateRole(role: Role): Promise<User> {
    // TODO: 串接後端 —— PATCH /api/me { role }
    if (!USE_MOCK) return request<User>('/me', { method: 'PATCH', body: { role } })
    return mock({ ...mockUser, role })
  },

  async updateNeeds(needs: AccessNeed[]): Promise<User> {
    // TODO: 串接後端 —— PATCH /api/me { needs }；需求會影響 Routes API 的 constraints
    if (!USE_MOCK) return request<User>('/me', { method: 'PATCH', body: { needs } })
    return mock({ ...mockUser, needs })
  },

  /* ---------------------------------------------------------------- 家庭 */

  async getFamily(): Promise<Family> {
    // TODO: 串接後端 —— GET /api/family
    if (!USE_MOCK) return request<Family>('/family')
    return mock(mockFamily)
  },

  async regenerateFamilyCode(): Promise<Family> {
    // TODO: 串接後端 —— POST /api/family/code（重新產生邀請碼，舊碼失效）
    if (!USE_MOCK) return request<Family>('/family/code', { method: 'POST' })
    const code = `AC-${Math.floor(10000 + Math.random() * 89999)}`
    return mock({ ...mockFamily, code })
  },

  async joinFamily(code: string): Promise<{ ok: boolean; family: Family }> {
    // TODO: 串接後端 —— POST /api/family/join { code }；錯誤碼要對應「代碼不存在／已過期」
    if (!USE_MOCK) return request('/family/join', { method: 'POST', body: { code } })
    return mock({ ok: code.trim().toUpperCase() === mockFamily.code, family: mockFamily })
  },

  async acceptInvite(inviteId: string): Promise<ApiOk> {
    // TODO: 串接後端 —— POST /api/family/invites/:id/accept
    if (!USE_MOCK) return request(`/family/invites/${inviteId}/accept`, { method: 'POST' })
    return mock({ ok: true } as ApiOk)
  },

  /* ------------------------------------------------------- 家人 / 成員狀態 */

  async getMembers(): Promise<Member[]> {
    // TODO: 串接後端 —— GET /api/members（Dashboard 需要輪詢或改用 WebSocket / SSE 即時更新）
    if (!USE_MOCK) return request<Member[]>('/members')
    return mock(mockMembers)
  },

  async getMember(id: string): Promise<Member | undefined> {
    // TODO: 串接後端 —— GET /api/members/:id
    if (!USE_MOCK) return request<Member>(`/members/${id}`)
    return mock(mockMembers.find((m) => m.id === id))
  },

  async updateMemberSettings(id: string, patch: Partial<Member>): Promise<Member> {
    // TODO: 串接後端 —— PATCH /api/members/:id（停留提醒分鐘數、各項通知開關）
    if (!USE_MOCK) return request<Member>(`/members/${id}`, { method: 'PATCH', body: patch })
    const target = mockMembers.find((m) => m.id === id) ?? mockMembers[0]!
    return mock({ ...target, ...patch })
  },

  /* ---------------------------------------------------- 導航 / Requirement */

  async parseRequirement(text: string): Promise<RequirementChip[]> {
    // TODO: 串接後端 —— POST /api/agent/requirement { text }
    //       後端再呼叫 LLM（Requirement Agent）把自然語言轉成結構化 constraints
    if (!USE_MOCK) return request<RequirementChip[]>('/agent/requirement', { method: 'POST', body: { text } })
    const chips = [...mockRequirementChips]
    if (text.trim()) chips[0] = { key: 'destination', label: text.trim() }
    return mock(chips, 600)
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
  },

  async getConstruction(): Promise<ConstructionZone[]> {
    // TODO: 串接後端 —— GET /api/construction（城市施工開放資料）
    if (!USE_MOCK) return request<ConstructionZone[]>('/construction')
    return mock([])
  },

  async getShelters(): Promise<Shelter[]> {
    // TODO: 串接後端 —— GET /api/shelters（避難所 / 可達性比較）
    if (!USE_MOCK) return request<Shelter[]>('/shelters')
    return mock(mockShelters)
  },

  /* ------------------------------------------- 首頁：常用地點 / 今日需求 */

  async getSavedPlaces(): Promise<SavedPlace[]> {
    // TODO: 串接後端 —— GET /api/places（使用者儲存的常用地點）
    if (!USE_MOCK) return request<SavedPlace[]>('/places')
    return mock(mockSavedPlaces)
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
    // TODO: 串接後端 —— GET /api/needs/today（可依使用者歷史推薦選項）
    if (!USE_MOCK) return request<TodayNeedOption[]>('/needs/today')
    return mock(mockTodayNeedOptions)
  },

  async saveTodayNeeds(keys: string[]): Promise<ApiOk> {
    // TODO: 串接後端 —— PATCH /api/needs/today { keys }
    //       今日需求只在當天有效，隔天自動清空（後端要記 expiresAt）
    if (!USE_MOCK) return request('/needs/today', { method: 'PATCH', body: { keys } })
    return mock({ ok: true } as ApiOk)
  },

  async getRecentTrips(): Promise<TripRecord[]> {
    // TODO: 串接後端 —— GET /api/trips/recent
    if (!USE_MOCK) return request<TripRecord[]>('/trips/recent')
    return mock(mockRecentTrips)
  },

  /* ------------------------------------------------------------ 行程 Trip */

  async getCurrentTrip(): Promise<Trip> {
    // TODO: 串接後端 —— GET /api/trips/current（照顧者看到的即時行程）
    if (!USE_MOCK) return request<Trip>('/trips/current')
    return mock(mockTrip)
  },

  async getWeeklyOverview(): Promise<WeeklyOverview> {
    // TODO: 串接後端 —— GET /api/trips/overview
    if (!USE_MOCK) return request<WeeklyOverview>('/trips/overview')
    return mock(mockWeeklyOverview)
  },

  async startTrip(destination: string, routeId: string): Promise<Trip> {
    // TODO: 串接後端 —— POST /api/trips { destination, routeId }，並開始上傳位置
    if (!USE_MOCK) return request<Trip>('/trips', { method: 'POST', body: { destination, routeId } })
    return mock({ ...mockTrip, destination })
  },

  async endTrip(tripId: string): Promise<ApiOk> {
    // TODO: 串接後端 —— POST /api/trips/:id/end
    if (!USE_MOCK) return request(`/trips/${tripId}/end`, { method: 'POST' })
    return mock({ ok: true } as ApiOk)
  },

  /* --------------------------------------------------- 安全提醒 / Check-in */

  async getAlerts(): Promise<CareAlert[]> {
    // TODO: 串接後端 —— GET /api/alerts（正式版建議改推播 / SSE）
    if (!USE_MOCK) return request<CareAlert[]>('/alerts')
    return mock(mockAlerts)
  },

  async sendSos(): Promise<CareAlert> {
    // TODO: 串接後端 —— POST /api/alerts/sos（帶目前 GPS 座標）
    if (!USE_MOCK) return request<CareAlert>('/alerts/sos', { method: 'POST' })
    return mock(mockAlerts[1]!)
  },

  async respondAlert(id: string, action: 'responding' | 'received'): Promise<ApiOk> {
    // TODO: 串接後端 —— POST /api/alerts/:id/respond { action }
    if (!USE_MOCK) return request(`/alerts/${id}/respond`, { method: 'POST', body: { action } })
    return mock({ ok: true } as ApiOk)
  },

  async checkIn(answer: 'ok' | 'need-help' | 'no-response'): Promise<ApiOk> {
    // TODO: 串接後端 —— POST /api/checkin { answer }
    //       answer = 'need-help' 或 'no-response'（逾時未回覆）時，後端會升級為 Care Alert
    if (!USE_MOCK) return request('/checkin', { method: 'POST', body: { answer } })
    return mock({ ok: true } as ApiOk)
  },

  async reportIssue(payload: { type: string; note: string }): Promise<ApiOk> {
    // TODO: 串接後端 —— POST /api/reports（使用者回報障礙物 / 施工）
    if (!USE_MOCK) return request('/reports', { method: 'POST', body: payload })
    return mock({ ok: true } as ApiOk)
  },

  /* -------------------------------------------------------------- 通知 */

  async getNotifications(): Promise<AppNotification[]> {
    // TODO: 串接後端 —— GET /api/notifications（正式版改推播 + 這支拿歷史）
    if (!USE_MOCK) return request<AppNotification[]>('/notifications')
    return mock(mockNotifications)
  },

  async markNotificationRead(id: string): Promise<ApiOk> {
    // TODO: 串接後端 —— POST /api/notifications/:id/read
    if (!USE_MOCK) return request(`/notifications/${id}/read`, { method: 'POST' })
    return mock({ ok: true } as ApiOk)
  },

  async markAllNotificationsRead(): Promise<ApiOk> {
    // TODO: 串接後端 —— POST /api/notifications/read-all
    if (!USE_MOCK) return request('/notifications/read-all', { method: 'POST' })
    return mock({ ok: true } as ApiOk)
  },

  /* ------------------------------------------------------------ 通知設定 */

  async getNotificationSettings(): Promise<NotificationSettings> {
    // TODO: 串接後端 —— GET /api/settings/notifications
    if (!USE_MOCK) return request<NotificationSettings>('/settings/notifications')
    return mock(mockNotificationSettings)
  },

  async updateNotificationSettings(
    patch: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    // TODO: 串接後端 —— PATCH /api/settings/notifications
    if (!USE_MOCK)
      return request<NotificationSettings>('/settings/notifications', {
        method: 'PATCH',
        body: patch,
      })
    return mock({ ...mockNotificationSettings, ...patch })
  },
}

export function useApi() {
  return api
}
