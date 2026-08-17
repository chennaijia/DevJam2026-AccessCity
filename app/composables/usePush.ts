/**
 * Web Push（Firebase Cloud Messaging）
 *
 * 流程：註冊 service worker → 要通知權限 → 拿裝置 token → 存到後端
 * 之後後端建立 Care Alert 時就會推播給這個裝置。
 *
 * 注意：
 *   - 一定要 HTTPS（localhost 例外）
 *   - iOS Safari 需 16.4+ 且要「加入主畫面」才收得到
 *   - 使用者封鎖通知後只能自己去瀏覽器設定解除，所以要保留 App 內的提醒中心當備援
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'

export type PushPermission = 'unsupported' | 'default' | 'granted' | 'denied'

let app: FirebaseApp | undefined

export function usePush() {
  const config = useRuntimeConfig().public.firebase
  const status = useState<PushPermission>('accessity:push', () => 'default')
  const busy = useState('accessity:push-busy', () => false)
  /** 前景收到的推播（系統通知不會跳，要自己顯示） */
  const foreground = useState<{ title: string; body: string; url?: string } | null>(
    'accessity:push-message',
    () => null,
  )

  const isConfigured = computed(() => !!config?.vapidKey && !!config?.messagingSenderId)

  function firebaseApp() {
    app ??= getApps()[0] ?? initializeApp({ ...config })
    return app
  }

  /** 目前的權限狀態，不會跳出詢問視窗 */
  async function refresh() {
    if (!import.meta.client || !isConfigured.value || !(await isSupported().catch(() => false))) {
      status.value = 'unsupported'
      return status.value
    }
    status.value = Notification.permission as PushPermission
    return status.value
  }

  /** 使用者按下「開啟通知」時才呼叫（一進站就要權限會被直接拒絕） */
  async function enable() {
    if ((await refresh()) === 'unsupported') return 'unsupported'

    busy.value = true
    try {
      const permission = await Notification.requestPermission()
      status.value = permission as PushPermission
      if (permission !== 'granted') return status.value

      // service worker 讀不到 runtimeConfig，設定用 query string 帶過去
      const params = new URLSearchParams({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        appId: config.appId,
        messagingSenderId: config.messagingSenderId,
      })
      const registration = await navigator.serviceWorker.register(
        `/firebase-messaging-sw.js?${params}`,
      )

      const token = await getToken(getMessaging(firebaseApp()), {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: registration,
      })

      if (token) await api.registerPushToken(token)

      // 前景訊息：系統不會跳通知，改成 App 內橫幅
      onMessage(getMessaging(firebaseApp()), (payload) => {
        foreground.value = {
          title: payload.notification?.title ?? 'Accessity',
          body: payload.notification?.body ?? '',
          url: payload.data?.url,
        }
      })

      return status.value
    } catch (error) {
      console.error('[push] 開啟通知失敗：', error)
      return status.value
    } finally {
      busy.value = false
    }
  }

  return { status, busy, foreground, isConfigured, refresh, enable }
}
