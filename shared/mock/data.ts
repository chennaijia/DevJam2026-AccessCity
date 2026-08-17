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
  name: '莊凱',
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
    name: '阿凱',
    initial: '凱',
    role: 'care-recipient',
    needsLabel: '使用輪椅 · 被照顧者',
    status: 'safe',
    statusLabel: '安全',
    lastLocation: '中山南路近仁愛路口',
    lastActivity: '步行中 · 4 分鐘前',
    lastActivityAt: '4 分鐘前',
    batteryPercent: 68,
    stayAlertMinutes: 15,
    notifications: { safetyCheck: true, location: true, emergency: true },
  },
  {
    id: 'm_ama',
    name: '阿嬤',
    initial: '阿',
    role: 'care-recipient',
    needsLabel: '視覺障礙 · 被照顧者',
    status: 'check-needed',
    statusLabel: '需要確認',
    lastLocation: '中央公園東門',
    lastActivity: '停留中 · 16 分鐘',
    lastActivityAt: '16 分鐘前',
    batteryPercent: 41,
    stayAlertMinutes: 15,
    invitePending: true,
    notifications: { safetyCheck: true, location: false, emergency: true },
  },
]

export const mockFamily: Family = {
  id: 'f_chuang',
  name: '莊家',
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
    title: '最快路線',
    badge: 'not-recommended',
    badgeLabel: '不建議',
    durationMinutes: 12,
    tags: [],
    warning: '偵測到通行障礙',
    segments: ['中山南路', '仁愛路四段'],
    steps: [],
  },
  {
    id: 'r_best',
    title: '最適合你的路線',
    badge: 'recommended',
    badgeLabel: '推薦',
    durationMinutes: 16,
    tags: ['無台階', '有電梯', '路況良好'],
    reason:
      '為什麼推薦這條？避開了中山南路的施工，而且會走可以正常使用的捷運站電梯。',
    accessibilityScore: 96,
    safetyScore: 92,
    segments: ['信義路', '車站廣場'],
    steps: [
      { instruction: '前方 120 公尺右轉進入中山南路', distanceMeters: 120, tag: '無台階' },
      { instruction: '直走 80 公尺，從斜坡道過馬路', distanceMeters: 80, tag: '斜坡道' },
      { instruction: '搭車站電梯上到地面層', distanceMeters: 40, tag: '電梯' },
      { instruction: '抵達社區活動中心', distanceMeters: 0, tag: '抵達' },
    ],
  },
  {
    id: 'r_comfort',
    title: '最好走的路線',
    badge: 'alternative',
    badgeLabel: '替代路線',
    durationMinutes: 19,
    tags: ['有遮蔭', '車流較少'],
    segments: ['林蔭大道', '公園路'],
    steps: [],
  },
]

export const mockShelters: Shelter[] = [
  {
    id: 's_alpha',
    key: 'A',
    name: '第一國小',
    distanceLabel: '320m',
    reachable: false,
    headline: '無法安全抵達',
    note: '路線會穿過淹水區域',
    tags: [],
    recommended: false,
  },
  {
    id: 's_community',
    key: 'B',
    name: '社區活動中心',
    distanceLabel: '510m',
    reachable: true,
    headline: '有安全可通行的路線',
    tags: ['輪椅可進出', '適合水患避難'],
    recommended: true,
  },
]

export const mockSavedPlaces: SavedPlace[] = [
  { id: 'p_home', label: '回家', address: '楓葉街 14 號', icon: 'house', primary: true },
  { id: 'p_hospital', label: '台大醫院', address: '中山南路 7 號', icon: 'shield' },
  { id: 'p_park', label: '中央公園', address: '中央公園東門', icon: 'walk' },
  { id: 'p_mrt', label: '捷運站', address: '中山南路站', icon: 'pin' },
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
    destination: '社區活動中心',
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
  currentLocation: '中山南路近仁愛路口',
  startedAt: '16:25',
  events: [
    { id: 'e1', time: '16:25', title: '行程開始', detail: '前往台大醫院', kind: 'start' },
    { id: 'e2', time: '16:32', title: '路線已調整', detail: '前方道路施工，已重新導航', kind: 'reroute' },
    { id: 'e3', time: '16:40', title: '休息 3 分鐘', detail: '正常', kind: 'rest' },
    { id: 'e4', time: '16:47', title: '觸發安全確認', detail: '非預期地點停留時間較長', kind: 'checkin' },
  ],
}

export const mockWeeklyOverview: WeeklyOverview = {
  kmTracked: 8.4,
  safeArrivals: 3,
  recentActivity: [
    { id: 'a1', title: '早晨散步', detail: '1.2 公里 · 25 分鐘', kind: 'walk' },
    { id: 'a2', title: '平安抵達', detail: '社區活動中心 · 上午 9:45', kind: 'arrival' },
  ],
}

export const mockAlerts: CareAlert[] = [
  {
    id: 'al_safety',
    kind: 'safety-check',
    memberId: 'm_kai',
    memberName: '阿凱',
    title: '安全確認提醒',
    message: '阿凱沒有回覆安全確認。',
    sourceLabel: '系統自動偵測',
    location: '中山南路近仁愛路口',
    time: '16:42 · 剛剛',
    lastMovement: '已停留 18 分鐘',
    acknowledged: false,
  },
  {
    id: 'al_emergency',
    kind: 'emergency',
    memberId: 'm_kai',
    memberName: '阿凱',
    title: '緊急求助',
    message: '阿凱按下了求助按鈕，需要立即協助。',
    sourceLabel: '手動 SOS',
    location: '中山南路近仁愛路口',
    time: '16:42 · 剛剛',
    lastMovement: '18 分鐘前',
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
    message: '前方中山南路施工，已幫你改走無障礙替代道路。',
    time: '16:32',
    read: true,
    actionTo: '/map/routes',
    actionLabel: '看路線',
  },
  {
    id: 'n_4',
    kind: 'arrival',
    title: '安全抵達',
    message: '已把「抵達社區活動中心」的訊息傳給陳乃嘉。',
    time: '昨天 16:28',
    read: true,
  },
  {
    id: 'n_5',
    kind: 'invite',
    title: '家庭邀請',
    message: '陳乃嘉 邀請你加入莊家。',
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
