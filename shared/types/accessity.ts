/**
 * 前後端共用型別（Nuxt 4 shared/ 目錄，可用 `#shared/types/accessity` 匯入）
 */

export type Role = 'care-recipient' | 'caregiver'

export type AccessNeed = 'visual' | 'wheelchair' | 'mobility' | 'other'

export type MemberStatus = 'safe' | 'check-needed' | 'emergency'

export interface User {
  id: string
  name: string
  email: string
  /** Google 頭像網址（用 Google 登入時帶進來） */
  avatar?: string
  /** 登入方式：google 或 demo 帳號 */
  provider?: 'google' | 'demo'
  role: Role
  needs: AccessNeed[]
  familyCode: string | null
  connectedCaregiver: { id: string; name: string } | null
}

export interface Family {
  id: string
  name: string
  code: string
  codeExpiresInDays: number
  members: Member[]
}

export interface Member {
  id: string
  name: string
  initial: string
  role: 'care-recipient' | 'caregiver'
  needsLabel: string
  status: MemberStatus
  statusLabel: string
  lastLocation: string
  lastActivity: string
  lastActivityAt: string
  batteryPercent: number
  stayAlertMinutes: number
  invitePending?: boolean
  notifications: {
    safetyCheck: boolean
    location: boolean
    emergency: boolean
  }
}

/** 需求 Agent 從自然語言解析出的條件（企劃書 §5 Requirement Agent） */
export interface RequirementChip {
  key: string
  label: string
}

export interface RouteStep {
  instruction: string
  distanceMeters: number
  tag?: string
}

/** 施工／封路資訊（城市開放資料的簡化版） */
export interface ConstructionZone {
  id: string
  road: string
  section: string
  until: string
  severity: 'blocked' | 'narrowed'
  note: string
  /** 施工現場座標，地圖上顯示吉祥物 icon 用；沒比對到座標時才會缺 */
  location?: { lat: number; lng: number }
}

/** 輪行台北的無障礙通行點（斜坡道/出入口），地圖上顯示吉祥物 icon 用 */
export interface AccessibilityFacility {
  lat: number
  lng: number
  name: string
}

export interface RouteOption {
  id: string
  title: string
  badge: 'recommended' | 'not-recommended' | 'alternative'
  badgeLabel: string
  durationMinutes: number
  tags: string[]
  warning?: string
  reason?: string
  accessibilityScore?: number
  safetyScore?: number
  distanceMeters?: number
  encodedPolyline?: string
  /** 這條路線會經過的路段，用來和施工資料做交叉比對 */
  segments?: string[]
  /** 比對後撞到的施工路段（前端會顯示在路線卡與導航畫面） */
  constructionConflicts?: ConstructionZone[]
  /** 沿途查到的無障礙通行點，勾 Wheelchair 時才會有值，地圖上顯示吉祥物 icon 用 */
  accessibilityFacilities?: AccessibilityFacility[]
  steps: RouteStep[]
}

export interface Shelter {
  id: string
  key: string
  name: string
  distanceLabel: string
  reachable: boolean
  headline: string
  note?: string
  tags: string[]
  recommended: boolean
}

/** 常用地點（首頁一鍵導航） */
export interface SavedPlace {
  id: string
  label: string
  address: string
  icon: 'house' | 'pin' | 'walk' | 'shield'
  primary?: boolean
}

/** 今日需求：只影響今天這幾趟的暫時性條件（企劃書 §4.2） */
export interface TodayNeedOption {
  key: string
  label: string
}

/** 最近行程紀錄 */
export interface TripRecord {
  id: string
  destination: string
  dateLabel: string
  durationLabel: string
  distanceLabel: string
  status: 'arrived' | 'stopped'
  statusLabel: string
}

export interface TripEvent {
  id: string
  time: string
  title: string
  detail: string
  kind: 'start' | 'reroute' | 'rest' | 'checkin' | 'arrival'
}

export interface Trip {
  id: string
  memberId: string
  status: 'on-trip' | 'idle' | 'arrived'
  destination: string
  eta: string
  currentLocation: string
  startedAt: string
  events: TripEvent[]
}

export interface WeeklyOverview {
  kmTracked: number
  safeArrivals: number
  recentActivity: { id: string; title: string; detail: string; kind: string }[]
}

/** 被照顧者端的通知（Check-in 詢問、照顧者回覆、路線調整、抵達…） */
export type NotificationKind = 'check-in' | 'caregiver' | 'route' | 'arrival' | 'invite' | 'system'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  message: string
  time: string
  read: boolean
  /** 點下去要前往的頁面，沒有就只是純通知 */
  actionTo?: string
  actionLabel?: string
}

export type AlertKind = 'safety-check' | 'emergency' | 'stationary'

export interface CareAlert {
  id: string
  kind: AlertKind
  memberId: string
  memberName: string
  title: string
  message: string
  sourceLabel: string
  location: string
  time: string
  lastMovement: string
  acknowledged: boolean
}

export interface NotificationSettings {
  caregiver: {
    emergencyAlert: boolean
    safetyCheckAlert: boolean
    stayDetection: boolean
    locationNotifications: boolean
  }
  recipient: {
    locationSharing: boolean
    caregiverConnection: boolean
    safetyCheck: boolean
    emergencyContactName: string
  }
}

export interface ApiOk {
  ok: true
}
