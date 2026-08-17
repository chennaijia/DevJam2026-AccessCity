/**
 * 簡易後端的記憶體資料庫（重啟後就會回到初始狀態）。
 * TODO: 正式版換成真的 DB（Postgres / Firestore），這個檔案改成 repository 層。
 */
import {
  mockAlerts,
  mockCaregiver,
  mockFamily,
  mockMembers,
  mockNotificationSettings,
  mockNotifications,
  mockRecentTrips,
  mockRoutes,
  mockShelters,
  mockTrip,
  mockUser,
  mockWeeklyOverview,
} from '#shared/mock/data'
import type {
  AppNotification,
  CareAlert,
  Family,
  Member,
  NotificationSettings,
  RouteOption,
  Shelter,
  Trip,
  TripRecord,
  User,
  WeeklyOverview,
} from '#shared/types/accessity'

interface Db {
  users: User[]
  currentUserId: string
  family: Family
  members: Member[]
  routes: RouteOption[]
  shelters: Shelter[]
  trip: Trip
  recentTrips: TripRecord[]
  todayNeeds: string[]
  overview: WeeklyOverview
  alerts: CareAlert[]
  notifications: AppNotification[]
  settings: NotificationSettings
  reports: { id: string; type: string; note: string; createdAt: string }[]
  checkins: { id: string; answer: string; createdAt: string }[]
}

export const db: Db = {
  users: [structuredClone(mockUser), structuredClone(mockCaregiver)],
  currentUserId: mockUser.id,
  family: structuredClone(mockFamily),
  members: structuredClone(mockMembers),
  routes: structuredClone(mockRoutes),
  shelters: structuredClone(mockShelters),
  trip: structuredClone(mockTrip),
  recentTrips: structuredClone(mockRecentTrips),
  todayNeeds: [],
  overview: structuredClone(mockWeeklyOverview),
  alerts: structuredClone(mockAlerts),
  notifications: structuredClone(mockNotifications),
  settings: structuredClone(mockNotificationSettings),
  reports: [],
  checkins: [],
}

/**
 * TODO: 換成真正的登入驗證（JWT / session cookie）。
 * 目前 demo 一律回傳 db.currentUserId 指到的使用者。
 */
export function currentUser(): User {
  return db.users.find((u) => u.id === db.currentUserId) ?? db.users[0]!
}

export function nowHHMM() {
  return new Date().toTimeString().slice(0, 5)
}
