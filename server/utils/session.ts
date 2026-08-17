import type { H3Event } from 'h3'
import { ensureFamilySeed, familyIdsOf, users, type UserDoc } from './repo'

/**
 * session cookie（nuxt-auth-utils 加密）→ App 內的使用者資料
 * cookie 只存 id / email / name / avatar，角色、需求、家庭都以資料庫為準。
 */
export interface SessionUser {
  id: string
  email: string
  name: string
  avatar?: string
  provider: 'google' | 'demo'
}

/**
 * 使用者快取：
 *   - event.context：同一個 request 內（middleware + handler）只查一次
 *   - 短 TTL 記憶體快取：同一次 SSR 會平行打好幾支 API，避免每支都往 Firestore 跑一趟
 * TODO: 有多台實例時改用 Redis 之類的共用快取，或直接把 user 放進 session。
 */
const USER_CACHE_TTL = 3000
const userCache = new Map<string, { user: UserDoc; at: number }>()

export function invalidateUserCache(id: string) {
  userCache.delete(id)
}

export async function getAppUser(event: H3Event): Promise<UserDoc | null> {
  const cached = event.context.appUser as UserDoc | undefined
  if (cached) return cached

  const session = await getUserSession(event)
  const sessionUser = session?.user as SessionUser | undefined
  if (!sessionUser) return null

  const hit = userCache.get(sessionUser.id)
  if (hit && Date.now() - hit.at < USER_CACHE_TTL) {
    event.context.appUser = hit.user
    return hit.user
  }

  await ensureFamilySeed()
  const user = await users.get(sessionUser.id)
  if (user) {
    userCache.set(sessionUser.id, { user, at: Date.now() })
    event.context.appUser = user
  }
  return user
}

/** 取得登入者；未登入直接回 401 */
export async function requireAppUser(event: H3Event): Promise<UserDoc> {
  const user = await getAppUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: '尚未登入' })
  return user
}

/** 主要照護圈（被照顧者＝自己的；照顧者＝目前主要連結的那一位）；沒有就 400 */
export async function requireFamilyId(event: H3Event): Promise<string> {
  const user = await requireAppUser(event)
  const [first] = familyIdsOf(user)
  if (!first) {
    throw createError({
      statusCode: 400,
      statusMessage:
        user.role === 'caregiver' ? '尚未連結任何家人' : '尚未建立照護圈，請先產生連結代碼',
    })
  }
  return first
}

/** 這個使用者能不能存取某個照護圈（照顧者可能連結多位家人） */
export async function canAccessFamily(event: H3Event, familyId: string): Promise<boolean> {
  const user = await requireAppUser(event)
  return familyIdsOf(user).includes(familyId)
}

export async function setAppSession(event: H3Event, user: UserDoc) {
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider ?? 'demo',
    } satisfies SessionUser,
    loggedInAt: new Date().toISOString(),
  })
}

export function nowHHMM() {
  return new Date().toTimeString().slice(0, 5)
}
