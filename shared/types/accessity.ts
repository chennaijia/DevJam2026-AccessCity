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
