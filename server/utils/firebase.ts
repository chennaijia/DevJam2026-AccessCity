import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Firebase Admin SDK（只在伺服器端使用）
 *
 * 需要 .env 的 NUXT_FIREBASE_SERVICE_ACCOUNT：
 *   Firebase Console → 專案設定 → 服務帳戶 → 產生新的私密金鑰，
 *   下載的 JSON 用 base64 編碼後貼進去（避免換行問題）：
 *     base64 -i service-account.json | pbcopy
 *
 * 沒有設定時，App 會自動退回記憶體資料（見 collections.ts），
 * 所以本機沒有金鑰也能把 demo 跑完。
 */
let app: App | undefined
let firestore: Firestore | undefined

function parseServiceAccount(raw: string) {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  return JSON.parse(text) as { project_id: string; client_email: string; private_key: string }
}

export function getFirebaseApp(): App | null {
  if (app) return app

  const { firebaseServiceAccount } = useRuntimeConfig()
  if (!firebaseServiceAccount) return null

  try {
    const credentials = parseServiceAccount(String(firebaseServiceAccount))
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: credentials.project_id,
          clientEmail: credentials.client_email,
          privateKey: credentials.private_key.replace(/\\n/g, '\n'),
        }),
      })
    return app
  } catch (error) {
    console.error('[firebase] 服務帳戶金鑰解析失敗，改用記憶體資料：', error)
    return null
  }
}

export function getFirebaseAuth(): Auth | null {
  const instance = getFirebaseApp()
  return instance ? getAuth(instance) : null
}

export function getDb(): Firestore | null {
  if (firestore) return firestore
  const instance = getFirebaseApp()
  if (!instance) return null

  firestore = getFirestore(instance)
  firestore.settings({ ignoreUndefinedProperties: true })
  return firestore
}

export function hasFirebase() {
  return !!getFirebaseApp()
}
