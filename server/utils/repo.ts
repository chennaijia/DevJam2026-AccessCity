/**
 * Repository 層：把 App 的資料模型對應到 collections。
 *
 * 資料切分：
 *   users / places / notifications / tripRecords / settings → 以 userId 為主
 *   families / members / alerts / trips                     → 以 familyId 為主
 * 這樣照顧者只會讀到自己家庭的資料，不像先前是全域共用。
 */
import type {
  AppNotification,
  CareAlert,
  Family,
  Member,
  NotificationSettings,
  SavedPlace,
  Trip,
  TripRecord,
  User,
} from '#shared/types/accessity'
import {
  mockAlerts,
  mockCaregiver,
  mockFamily,
  mockMembers,
  mockNotificationSettings,
  mockNotifications,
  mockRecentTrips,
  mockSavedPlaces,
  mockTrip,
  mockUser,
} from '#shared/mock/data'
import { collection } from './collections'

/** Demo 家庭：新帳號會直接加進來，這樣一登入就看得到內容 */
export const DEMO_FAMILY_ID = 'f_chuang'

export interface UserDoc extends User {
  familyId: string | null
  todayNeeds: string[]
  /** Web Push 的裝置 token（一個帳號可能有多個裝置） */
  fcmTokens?: string[]
}
export interface FamilyDoc extends Omit<Family, 'members'> {}
export interface MemberDoc extends Member {
  familyId: string
}
export interface AlertDoc extends CareAlert {
  familyId: string
  createdAt: string
}
export interface NotificationDoc extends AppNotification {
  userId: string
}
export interface TripDoc extends Trip {
  familyId: string
}
export interface TripRecordDoc extends TripRecord {
  userId: string
}
export interface PlaceDoc extends SavedPlace {
  userId: string
}
export interface SettingsDoc extends NotificationSettings {
  /** id = userId */
  id: string
}
export interface ReportDoc {
  id: string
  userId: string
  type: string
  note: string
  createdAt: string
}
export interface CheckinDoc {
  id: string
  userId: string
  answer: string
  createdAt: string
}

export const users = collection<UserDoc>('users')
export const families = collection<FamilyDoc>('families')
export const members = collection<MemberDoc>('members')
export const alerts = collection<AlertDoc>('alerts')
export const trips = collection<TripDoc>('trips')
export const tripRecords = collection<TripRecordDoc>('tripRecords')
export const notifications = collection<NotificationDoc>('notifications')
export const places = collection<PlaceDoc>('places')
export const settings = collection<SettingsDoc>('settings')
export const reports = collection<ReportDoc>('reports')
export const checkins = collection<CheckinDoc>('checkins')

/** 家庭層級的種子資料（第一次啟動時建立） */
let familySeeded = false

export async function ensureFamilySeed() {
  if (familySeeded) return
  familySeeded = true

  await families.seed([
    {
      id: DEMO_FAMILY_ID,
      name: mockFamily.name,
      code: mockFamily.code,
      codeExpiresInDays: mockFamily.codeExpiresInDays,
    },
  ])

  await members.seed(mockMembers.map((m) => ({ ...m, familyId: DEMO_FAMILY_ID })))

  await alerts.seed(
    mockAlerts.map((a) => ({ ...a, familyId: DEMO_FAMILY_ID, createdAt: new Date().toISOString() })),
  )

  await trips.seed([{ ...mockTrip, familyId: DEMO_FAMILY_ID }])

  await users.seed([
    { ...mockUser, familyId: DEMO_FAMILY_ID, todayNeeds: [] },
    { ...mockCaregiver, familyId: DEMO_FAMILY_ID, todayNeeds: [] },
  ])
}

/**
 * 個人層級的種子資料：新帳號第一次登入時，複製一份 demo 的常用地點、
 * 通知與行程紀錄給他，否則新帳號登入後畫面會是空的。
 */
const seededUsers = new Set<string>()

export async function ensureUserSeed(userId: string) {
  // 同一個 process 內只檢查一次，否則每個 request 都要多打好幾次查詢
  if (seededUsers.has(userId)) return
  seededUsers.add(userId)

  const [ownPlaces, ownNotifications, ownRecords, ownSettings] = await Promise.all([
    places.list({ userId } as Partial<PlaceDoc>),
    notifications.list({ userId } as Partial<NotificationDoc>),
    tripRecords.list({ userId } as Partial<TripRecordDoc>),
    settings.get(userId),
  ])

  if (!ownPlaces.length) {
    for (const place of mockSavedPlaces) {
      await places.set({ ...place, id: `${userId}_${place.id}`, userId })
    }
  }

  if (!ownNotifications.length) {
    for (const item of mockNotifications) {
      await notifications.set({ ...item, id: `${userId}_${item.id}`, userId })
    }
  }

  if (!ownRecords.length) {
    for (const record of mockRecentTrips) {
      await tripRecords.set({ ...record, id: `${userId}_${record.id}`, userId })
    }
  }

  if (!ownSettings) {
    await settings.set({ ...mockNotificationSettings, id: userId })
  }
}

/** 由 Firebase 的登入資料建立或更新使用者 */
export async function upsertUser(profile: {
  id: string
  email: string
  name?: string
  avatar?: string
  provider?: 'google' | 'demo'
}): Promise<UserDoc> {
  await ensureFamilySeed()

  const existingById = await users.get(profile.id)
  const existing =
    existingById ??
    (await users.list()).find((u) => u.email.toLowerCase() === profile.email.toLowerCase())

  if (existing) {
    const updated = await users.update(existing.id, {
      name: profile.name || existing.name,
      avatar: profile.avatar ?? existing.avatar,
      provider: profile.provider ?? existing.provider,
    })
    await ensureUserSeed(updated.id)
    return updated
  }

  const created: UserDoc = {
    id: profile.id,
    name: profile.name || profile.email.split('@')[0]!,
    email: profile.email.toLowerCase(),
    avatar: profile.avatar,
    provider: profile.provider ?? 'google',
    role: 'care-recipient',
    needs: [],
    // Demo：新帳號直接加入示範家庭，一登入就看得到資料
    familyCode: mockFamily.code,
    familyId: DEMO_FAMILY_ID,
    connectedCaregiver: { id: 'u_naijia', name: '陳乃嘉' },
    todayNeeds: [],
  }

  await users.set(created)
  await ensureUserSeed(created.id)
  return created
}
