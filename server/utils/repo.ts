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
  /** 被照顧者：自己的照護圈；照顧者：主要（第一個）連結的照護圈 */
  familyId: string | null
  /** 照顧者可以同時連結多位家人，所以另外存一份清單 */
  familyIds?: string[]
  todayNeeds: string[]
  /** 使用者自己改過名字；之後 Google 登入不要再覆蓋 */
  nameCustomized?: boolean
  /** 完成（或明確跳過）新手流程的時間；null = 還沒走完 */
  onboardingCompletedAt?: string | null
  /** Web Push 的裝置 token（一個帳號可能有多個裝置） */
  fcmTokens?: string[]
}
export interface FamilyDoc extends Omit<Family, 'members'> {
  /** 建立這個家庭的照顧者 */
  ownerId?: string
  /** 代碼產生時間，用來判斷有沒有過期 */
  codeCreatedAt?: string
}
export interface MemberDoc extends Member {
  familyId: string
  /** 對應的帳號；種子資料沒有帳號所以是選填 */
  userId?: string
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
      codeCreatedAt: new Date().toISOString(),
      ownerId: 'u_naijia',
    },
  ])

  await members.seed(
    mockMembers.map((m) => ({
      ...m,
      familyId: DEMO_FAMILY_ID,
      // 種子成員對應 demo 帳號，這樣 demo 登入後看到的是自己
      userId: m.id === 'm_kai' ? 'u_kai' : undefined,
    })),
  )

  await alerts.seed(
    mockAlerts.map((a) => ({ ...a, familyId: DEMO_FAMILY_ID, createdAt: new Date().toISOString() })),
  )

  await trips.seed([{ ...mockTrip, familyId: DEMO_FAMILY_ID }])

  const seededAt = new Date().toISOString()
  await users.seed([
    { ...mockUser, familyId: DEMO_FAMILY_ID, todayNeeds: [], onboardingCompletedAt: seededAt },
    { ...mockCaregiver, familyId: DEMO_FAMILY_ID, todayNeeds: [], onboardingCompletedAt: seededAt },
  ])

  // 舊資料補綁定：demo 成員 m_kai 對應 demo 帳號 u_kai，
  // 否則同一個人會同時存在「種子成員」與「加入後新建的成員」兩筆
  const seededKai = await members.get('m_kai')
  if (seededKai && !seededKai.userId) await members.update('m_kai', { userId: 'u_kai' })

  // demo 帳號視為已完成新手流程，登入後直接進主頁
  for (const id of ['u_kai', 'u_naijia']) {
    const demo = await users.get(id)
    if (demo && !demo.onboardingCompletedAt) {
      await users.update(id, { onboardingCompletedAt: new Date().toISOString() })
    }
  }

  await migrateToRecipientOwnedCodes()
}

/**
 * 舊模型是「照顧者持有家庭代碼」，現在改成「被照顧者持有自己的照護圈」。
 * 這段把 demo 資料搬過來：Kai 擁有原本的照護圈，阿嬤獨立成一個，
 * 照顧者則同時連結兩位——順便示範一位照顧者可以照顧多人。
 */
async function migrateToRecipientOwnedCodes() {
  const demoFamily = await families.get(DEMO_FAMILY_ID)
  if (!demoFamily) return

  // 1. 原本的照護圈改由 Kai 持有
  if (demoFamily.ownerId !== 'u_kai') {
    await families.update(DEMO_FAMILY_ID, { ownerId: 'u_kai' })
  }

  // 2. 阿嬤搬到自己的照護圈
  const ama = await members.get('m_ama')
  const AMA_FAMILY_ID = 'f_ama'
  if (ama && ama.familyId === DEMO_FAMILY_ID) {
    await families.set({
      id: AMA_FAMILY_ID,
      name: '阿嬤的照護圈',
      code: generateFamilyCode(),
      codeExpiresInDays: 7,
      codeCreatedAt: new Date().toISOString(),
      ownerId: 'u_ama',
    })
    await members.update('m_ama', { familyId: AMA_FAMILY_ID })
  }

  // 3. 照顧者同時連結兩位家人
  const caregiver = await users.get('u_naijia')
  if (caregiver && !(caregiver.familyIds ?? []).includes(AMA_FAMILY_ID)) {
    await users.update('u_naijia', {
      familyId: DEMO_FAMILY_ID,
      familyIds: [DEMO_FAMILY_ID, AMA_FAMILY_ID],
    })
  }
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

/** 家庭代碼：AC- 開頭的 5 位數字，和設計稿一致 */
export function generateFamilyCode() {
  return `AC-${Math.floor(10000 + Math.random() * 89999)}`
}

/** 代碼是否還有效 */
export function isCodeExpired(family: FamilyDoc) {
  if (!family.codeCreatedAt) return false
  const expiresAt =
    new Date(family.codeCreatedAt).getTime() + family.codeExpiresInDays * 24 * 60 * 60 * 1000
  return Date.now() > expiresAt
}

/** 使用者能看到的所有照護圈（照顧者可能同時連結多位家人） */
export function familyIdsOf(user: UserDoc): string[] {
  if (user.role === 'caregiver') {
    const list = user.familyIds ?? (user.familyId ? [user.familyId] : [])
    return [...new Set(list)]
  }
  return user.familyId ? [user.familyId] : []
}

/**
 * 被照顧者第一次進到「我的連結代碼」時，幫他建立自己的照護圈。
 * 代碼由被照顧者持有：要不要讓人看到自己的位置，決定權在他身上。
 */
export async function createFamilyFor(user: UserDoc): Promise<FamilyDoc> {
  const family: FamilyDoc = {
    id: `f_${user.id}_${Date.now()}`,
    name: `${user.name} 的照護圈`,
    code: generateFamilyCode(),
    codeExpiresInDays: 7,
    codeCreatedAt: new Date().toISOString(),
    ownerId: user.id,
  }

  await families.set(family)
  await users.update(user.id, { familyId: family.id, familyCode: family.code })

  // 建立的同時就把自己登記成成員，照顧者連結後立刻看得到
  await addMemberFor({ ...user, familyId: family.id }, family.id)
  return family
}

/**
 * 把帳號登記成家庭成員（照顧者的 Dashboard 是讀 members，不是讀 users）。
 * 同一個帳號重複加入不會產生第二筆。
 */
export async function addMemberFor(user: UserDoc, familyId: string): Promise<MemberDoc> {
  const existing = (await members.list({ familyId } as Partial<MemberDoc>)).find(
    (m) => m.userId === user.id,
  )
  if (existing) return existing

  const needsLabel = user.needs.length
    ? `${user.needs
        .map((n) =>
          n === 'wheelchair'
            ? '使用輪椅'
            : n === 'visual'
              ? '視覺障礙'
              : n === 'mobility'
                ? '行動不便'
                : '其他需求',
        )
        .join(' · ')} · 被照顧者`
    : '被照顧者'

  const member: MemberDoc = {
    id: `m_${user.id}`,
    familyId,
    userId: user.id,
    name: user.name,
    initial: user.name.slice(0, 1).toUpperCase(),
    role: 'care-recipient',
    needsLabel,
    status: 'safe',
    statusLabel: '安全',
    lastLocation: '尚未取得位置',
    lastActivity: '剛加入',
    lastActivityAt: '剛剛',
    batteryPercent: 100,
    stayAlertMinutes: 15,
    notifications: { safetyCheck: true, location: true, emergency: true },
  }

  await members.set(member)
  return member
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
    // 這個欄位是後來才加的：已經有家庭或已設定需求的舊帳號，視為早就走完流程
    const backfilledOnboarding =
      existing.onboardingCompletedAt ??
      (existing.familyId || existing.needs.length ? new Date().toISOString() : null)

    const updated = await users.update(existing.id, {
      onboardingCompletedAt: backfilledOnboarding,
      // 自己改過的名字優先，其餘欄位每次登入都跟 Google 同步
      name: existing.nameCustomized ? existing.name : profile.name || existing.name,
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
    // 家庭要自己建立（照顧者）或用代碼加入（被照顧者）
    familyCode: null,
    familyId: null,
    connectedCaregiver: null,
    todayNeeds: [],
    onboardingCompletedAt: null,
  }

  await users.set(created)
  await ensureUserSeed(created.id)
  return created
}
