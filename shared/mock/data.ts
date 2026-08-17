/**
 * Demo 用的模擬資料。
 * 前端（USE_MOCK = true 時）與簡易後端（server/utils/store.ts 的初始資料）共用同一份，
 * 之後接真實資料庫時，只要換掉 server 端的資料來源即可。
 */
import type {
  AppNotification,
  CareAlert,
  Family,
  Member,
  SavedPlace,
  TodayNeedOption,
  TripRecord,
  NotificationSettings,
  RequirementChip,
  RouteOption,
  Shelter,
  Trip,
  User,
  WeeklyOverview,
} from '#shared/types/accessity'

export const mockUser: User = {
  id: 'u_kai',
  name: 'Kai Chuang',
  email: 'kai@example.com',
  role: 'care-recipient',
  needs: ['wheelchair', 'mobility'],
  familyCode: 'AC-72841',
  connectedCaregiver: { id: 'u_naijia', name: '陳乃嘉' },
}

export const mockCaregiver: User = {
  id: 'u_naijia',
  name: '陳乃嘉',
  email: 'naijia@example.com',
  role: 'caregiver',
  needs: [],
  familyCode: 'AC-72841',
  connectedCaregiver: null,
}

export const mockMembers: Member[] = [
  {
    id: 'm_kai',
    name: 'Kai',
    initial: 'K',
    role: 'care-recipient',
    needsLabel: 'Wheelchair · receiving care',
    status: 'safe',
    statusLabel: 'Safe',
    lastLocation: 'Main St. near 4th Ave',
    lastActivity: 'Walking · 4 min ago',
    lastActivityAt: '4 minutes ago',
    batteryPercent: 68,
    stayAlertMinutes: 15,
    notifications: { safetyCheck: true, location: true, emergency: true },
  },
  {
    id: 'm_ama',
    name: '阿嬤',
    initial: '阿',
    role: 'care-recipient',
    needsLabel: 'Visual impairment · receiving care',
    status: 'check-needed',
    statusLabel: 'Check needed',
    lastLocation: 'Central Park east gate',
    lastActivity: 'Stationary · 16 min',
    lastActivityAt: '16 minutes ago',
    batteryPercent: 41,
    stayAlertMinutes: 15,
    invitePending: true,
    notifications: { safetyCheck: true, location: false, emergency: true },
  },
]

export const mockFamily: Family = {
  id: 'f_chuang',
  name: 'Chuang Family',
  code: 'AC-72841',
  codeExpiresInDays: 7,
  members: mockMembers,
}

/** Requirement Agent 的解析結果（Scene 1：「我要去台大醫院，今天走路不太方便，也想避開施工」） */
export const mockRequirementChips: RequirementChip[] = [
  { key: 'destination', label: '台大醫院' },
  { key: 'mobility', label: '行動協助' },
  { key: 'avoid-construction', label: '避開施工' },
  { key: 'voice', label: '語音導航' },
]

export const mockRoutes: RouteOption[] = [
  {
    id: 'r_fast',
    title: 'Fastest Route',
    badge: 'not-recommended',
    badgeLabel: 'NOT RECOMMENDED',
    durationMinutes: 12,
    tags: [],
    warning: 'Obstacles detected',
    segments: ['Main St', '4th Ave'],
    steps: [],
  },
  {
    id: 'r_best',
    title: 'Best for You',
    badge: 'recommended',
    badgeLabel: 'RECOMMENDED',
    durationMinutes: 16,
    tags: ['Step-free', 'Elevator', 'Clear'],
    reason:
      'Why this route? Avoids the construction on Main St and uses the functional station elevator.',
    accessibilityScore: 96,
    safetyScore: 92,
    segments: ['Oak Ave', 'Station Plaza'],
    steps: [
      { instruction: 'Turn right in 120m onto Main St', distanceMeters: 120, tag: 'Step-free' },
      { instruction: 'Continue 80m, then cross at the ramp', distanceMeters: 80, tag: 'Ramp' },
      { instruction: 'Take the station elevator to street level', distanceMeters: 40, tag: 'Elevator' },
      { instruction: 'Arrive at Community Center', distanceMeters: 0, tag: 'Arrival' },
    ],
  },
  {
    id: 'r_comfort',
    title: 'Comfortable',
    badge: 'alternative',
    badgeLabel: 'ALTERNATIVE',
    durationMinutes: 19,
    tags: ['Shady', 'Less traffic'],
    segments: ['Elm St', 'Park Lane'],
    steps: [],
  },
]

export const mockShelters: Shelter[] = [
  {
    id: 's_alpha',
    key: 'A',
    name: 'School Alpha',
    distanceLabel: '320m',
    reachable: false,
    headline: 'Not Reachable Safely',
    note: 'Route crosses flood zone',
    tags: [],
    recommended: false,
  },
  {
    id: 's_community',
    key: 'B',
    name: 'Community Center',
    distanceLabel: '510m',
    reachable: true,
    headline: 'Safe Reachable Route',
    tags: ['Wheelchair Accessible', 'Suitable for Flood Evacuation'],
    recommended: true,
  },
]

export const mockSavedPlaces: SavedPlace[] = [
  { id: 'p_home', label: '回家', address: '14 Maple Ave', icon: 'house', primary: true },
  { id: 'p_hospital', label: '台大醫院', address: '中山南路 7 號', icon: 'shield' },
  { id: 'p_park', label: '中央公園', address: 'Central Park east gate', icon: 'walk' },
  { id: 'p_mrt', label: '捷運站', address: 'Main St. Station', icon: 'pin' },
]

/** 今日需求選項：只影響今天的路線，不會覆蓋固定需求 */
export const mockTodayNeedOptions: TodayNeedOption[] = [
  { key: 'tired', label: '今天腳比較痠' },
  { key: 'short', label: '想少走一點' },
  { key: 'avoid-construction', label: '想避開施工' },
  { key: 'rest', label: '需要休息點' },
  { key: 'shade', label: '想走遮蔭' },
]

export const mockRecentTrips: TripRecord[] = [
  {
    id: 'tr_1',
    destination: '台大醫院',
    dateLabel: '今天 09:20',
    durationLabel: '25 分鐘',
    distanceLabel: '1.2 km',
    status: 'arrived',
    statusLabel: '安全抵達',
  },
  {
    id: 'tr_2',
    destination: 'Community Center',
    dateLabel: '昨天 16:10',
    durationLabel: '18 分鐘',
    distanceLabel: '0.9 km',
    status: 'arrived',
    statusLabel: '安全抵達',
  },
  {
    id: 'tr_3',
    destination: '中央公園',
    dateLabel: '週一 15:02',
    durationLabel: '12 分鐘',
    distanceLabel: '0.6 km',
    status: 'stopped',
    statusLabel: '中途結束',
  },
]

export const mockTrip: Trip = {
  id: 't_1',
  memberId: 'm_kai',
  status: 'on-trip',
  destination: '台大醫院',
  eta: '16:58',
  currentLocation: 'Main St. near 4th Ave',
  startedAt: '16:25',
  events: [
    { id: 'e1', time: '16:25', title: 'Trip Started', detail: '前往台大醫院', kind: 'start' },
    { id: 'e2', time: '16:32', title: 'Route Adjusted', detail: '前方道路施工，已重新導航', kind: 'reroute' },
    { id: 'e3', time: '16:40', title: 'Rested 3 min', detail: '正常', kind: 'rest' },
    { id: 'e4', time: '16:47', title: 'Check-in Triggered', detail: '非預期地點停留時間較長', kind: 'checkin' },
  ],
}

export const mockWeeklyOverview: WeeklyOverview = {
  kmTracked: 8.4,
  safeArrivals: 3,
  recentActivity: [
    { id: 'a1', title: 'Morning Walk', detail: '1.2km · 25 mins', kind: 'walk' },
    { id: 'a2', title: 'Safe Arrival', detail: 'Community Center • 9:45 AM', kind: 'arrival' },
  ],
}

export const mockAlerts: CareAlert[] = [
  {
    id: 'al_safety',
    kind: 'safety-check',
    memberId: 'm_kai',
    memberName: 'Kai',
    title: 'Safety Alert',
    message: 'Kai has not responded to the safety check.',
    sourceLabel: 'Automatic Safety Alert',
    location: 'Main St. near 4th Ave',
    time: '16:42 · just now',
    lastMovement: 'Stayed 18 minutes',
    acknowledged: false,
  },
  {
    id: 'al_emergency',
    kind: 'emergency',
    memberId: 'm_kai',
    memberName: 'Kai',
    title: 'Emergency Alert',
    message: 'Kai has requested immediate assistance.',
    sourceLabel: 'Manual SOS',
    location: 'Main St. near 4th Ave',
    time: '16:42 · just now',
    lastMovement: '18 minutes ago',
    acknowledged: false,
  },
]

export const mockNotifications: AppNotification[] = [
  {
    id: 'n_1',
    kind: 'check-in',
    title: '你還好嗎？',
    message: '你在同一個地方停留超過 15 分鐘，需要幫忙嗎？',
    time: '剛剛',
    read: false,
    actionTo: '/map/navigate',
    actionLabel: '回覆',
  },
  {
    id: 'n_2',
    kind: 'caregiver',
    title: '陳乃嘉 正在前往',
    message: '你的照顧者已收到提醒，正在過去找你。',
    time: '3 分鐘前',
    read: false,
  },
  {
    id: 'n_3',
    kind: 'route',
    title: '路線已調整',
    message: '前方 Main St 施工，已幫你改走無障礙替代道路。',
    time: '16:32',
    read: true,
    actionTo: '/map/routes',
    actionLabel: '看路線',
  },
  {
    id: 'n_4',
    kind: 'arrival',
    title: '安全抵達',
    message: '已把「抵達 Community Center」的訊息傳給陳乃嘉。',
    time: '昨天 16:28',
    read: true,
  },
  {
    id: 'n_5',
    kind: 'invite',
    title: '家庭邀請',
    message: '陳乃嘉 邀請你加入 Chuang Family。',
    time: '週一',
    read: true,
    actionTo: '/onboarding/connect',
    actionLabel: '查看',
  },
]

export const mockNotificationSettings: NotificationSettings = {
  caregiver: {
    emergencyAlert: true,
    safetyCheckAlert: true,
    stayDetection: true,
    locationNotifications: false,
  },
  recipient: {
    locationSharing: true,
    caregiverConnection: true,
    safetyCheck: true,
    emergencyContactName: '陳乃嘉',
  },
}
