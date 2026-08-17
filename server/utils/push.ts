import { getMessaging } from 'firebase-admin/messaging'
import { getFirebaseApp } from './firebase'
import { users, type UserDoc } from './repo'
import { invalidateUserCache } from './session'

/**
 * Web Push 發送。
 * 沒有設定 Firebase 或對方沒開通知時會安靜跳過，不會讓建立提醒的流程失敗。
 */
export interface PushPayload {
  title: string
  body: string
  /** 點通知要開的頁面 */
  url?: string
  alertId?: string
  kind?: 'alert' | 'info' | 'emergency'
}

/** 把失效的 token 從使用者身上清掉，否則會越積越多 */
const DEAD_TOKEN_ERRORS = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]

async function sendToUser(user: UserDoc, payload: PushPayload) {
  const tokens = user.fcmTokens ?? []
  if (!tokens.length) return { sent: 0, failed: 0 }

  const app = getFirebaseApp()
  if (!app) return { sent: 0, failed: 0 }

  const url = payload.url ?? '/caregiver/alerts'

  const message = {
    notification: { title: payload.title, body: payload.body },
    data: {
      url,
      alertId: payload.alertId ?? '',
      kind: payload.kind ?? 'alert',
    },
    webpush: {
      fcmOptions: { link: url },
      notification: { icon: '/mimo-icon.png', requireInteraction: payload.kind !== 'info' },
    },
  }

  const messaging = getMessaging(app)

  // 一顆一顆送：格式錯誤的 token 會讓整批 multicast 直接被拒絕，
  // 這樣才分得出是哪一台裝置失效，也不會因為一台壞掉就全部收不到。
  const results = await Promise.all(
    tokens.map(async (token) => {
      try {
        await messaging.send({ ...message, token })
        return { token, ok: true, dead: false }
      } catch (error) {
        const code = (error as { errorInfo?: { code?: string }; code?: string })?.errorInfo?.code
          ?? (error as { code?: string })?.code
          ?? ''
        return { token, ok: false, dead: DEAD_TOKEN_ERRORS.includes(code) }
      }
    }),
  )

  const dead = results.filter((r) => r.dead).map((r) => r.token)

  if (dead.length) {
    await users.update(user.id, { fcmTokens: tokens.filter((t) => !dead.includes(t)) })
    // 讓後續請求立刻讀到清乾淨的 token 清單
    invalidateUserCache(user.id)
  }

  return {
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  }
}

/** 通知家庭裡所有照顧者（Care Alert 用） */
export async function notifyCaregivers(familyId: string, payload: PushPayload) {
  try {
    const all = await users.list({ familyId } as Partial<UserDoc>)
    const caregivers = all.filter((u) => u.role === 'caregiver')

    const results = await Promise.all(caregivers.map((u) => sendToUser(u, payload)))
    return results.reduce((acc, r) => acc + r.sent, 0)
  } catch (error) {
    // 推播失敗不能影響提醒本身的建立
    console.error('[push] 通知照顧者失敗：', error)
    return 0
  }
}

/** 通知單一使用者（Check-in 詢問、照顧者已回覆…） */
export async function notifyUser(userId: string, payload: PushPayload) {
  try {
    const user = await users.get(userId)
    if (!user) return 0
    const result = await sendToUser(user, payload)
    return result.sent
  } catch (error) {
    console.error('[push] 通知使用者失敗：', error)
    return 0
  }
}
