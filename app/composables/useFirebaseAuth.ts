/**
 * 前端的 Firebase 登入。
 * 只負責「拿到 Google 的 idToken」，驗證與建立 session 都在後端（POST /api/auth/firebase）。
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  type Auth,
} from 'firebase/auth'

let app: FirebaseApp | undefined

export function useFirebaseAuth() {
  const config = useRuntimeConfig().public.firebase

  const isConfigured = computed(() => !!config?.apiKey && !!config?.authDomain)

  function auth(): Auth {
    if (!isConfigured.value) throw new Error('Firebase 尚未設定')
    app ??= getApps()[0] ?? initializeApp({ ...config })
    return getAuth(app)
  }

  /** 開 Google 登入視窗，回傳可以送給後端驗證的 idToken */
  async function signInWithGoogle(): Promise<string> {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    const credential = await signInWithPopup(auth(), provider)
    return await credential.user.getIdToken()
  }

  /** 登出 Firebase 端（App 的 session 由 /api/auth/logout 清除） */
  async function signOutFirebase() {
    if (!isConfigured.value) return
    try {
      await signOut(auth())
    } catch {
      // 沒登入過就忽略
    }
  }

  return { isConfigured, signInWithGoogle, signOutFirebase }
}
