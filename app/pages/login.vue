<script setup lang="ts">
/**
 * 登入：只用 Google 帳號（OAuth）。
 * 按下按鈕後整頁跳轉到 /api/auth/google，由後端和 Google 換 token，
 * 成功後寫入加密的 session cookie 再導回 App。
 */
const { setUser, applyPendingRole, homePath, pendingRole } = useSession()
const { signInWithGoogle } = useFirebaseAuth()
const route = useRoute()

/** 第一頁選的身分，讓使用者知道自己正以什麼身分登入，也可以退回去改 */
const roleLabel = computed(() =>
  pendingRole.value === 'caregiver' ? '照顧者' : pendingRole.value ? '被照顧者' : '',
)

/** Google 登入有沒有設定好（只回傳布林值，不會拿到金鑰） */
const { data: authConfig } = await useFetch('/api/auth/config')
const googleEnabled = computed(() => authConfig.value?.googleEnabled ?? false)

const errorMessages: Record<string, string> = {
  google: 'Google 登入沒有完成，請再試一次',
  setup: '尚未設定 Firebase 登入金鑰，請先完成設定或改用 Demo 帳號',
  popup: '登入視窗被關閉或被瀏覽器擋住，請再試一次',
}
const error = ref(errorMessages[route.query.error as string] ?? '')
const loading = ref(false)

async function loginWithGoogle() {
  if (!googleEnabled.value) {
    error.value = errorMessages.setup!
    return
  }

  error.value = ''
  loading.value = true
  try {
    // 1. Firebase 開 Google 登入視窗，拿到 idToken
    const idToken = await signInWithGoogle()
    // 2. 後端用 Admin SDK 驗證 idToken，建立我們自己的 session cookie
    const user = await api.loginWithFirebase(idToken)
    setUser(user)
    await navigateTo(homePath.value)
  } catch (err) {
    console.error('[login] Google 登入失敗：', err)
    error.value = errorMessages.popup!
  } finally {
    loading.value = false
  }
}

/** 沒有設定 Google 金鑰時的備援，讓 demo 還是走得完 */
async function loginAsDemo() {
  error.value = ''
  loading.value = true
  try {
    const user = await api.demoLogin(pendingRole.value ?? 'care-recipient')
    setUser(user)
    await applyPendingRole()
    await navigateTo(homePath.value)
  } catch {
    error.value = '登入失敗，請再試一次'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="screen login">
    <button
      type="button"
      class="login__back"
      aria-label="返回選擇身分"
      @click="navigateTo('/onboarding/welcome')"
    >
      ←
    </button>

    <div class="login__brand center">
      <h1 class="brand" style="font-size: 34px">Accessity</h1>
      <p class="body">Reachable routes for everyone.</p>
      <p v-if="roleLabel" class="login__role">
        以 <b>{{ roleLabel }}</b> 身分登入 ·
        <NuxtLink to="/onboarding/welcome">重新選擇</NuxtLink>
      </p>
    </div>

    <p v-if="error" class="center" style="color: var(--red); font-weight: 600">{{ error }}</p>

    <UiButton variant="outline" :disabled="loading || !googleEnabled" @click="loginWithGoogle">
      <span class="g-mark" aria-hidden="true">
        <svg viewBox="0 0 18 18" width="18" height="18">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
      </span>
      使用 Google 帳號登入
    </UiButton>

    <p v-if="googleEnabled" class="muted center">
      第一次登入會自動建立帳號，我們只會讀取你的姓名、Email 與頭像。
    </p>

    <!-- 金鑰還沒填時，直接把要做的事寫在畫面上，不用去翻 log -->
    <UiCard v-else variant="soft" padding="12px 14px">
      <div class="setup">
        <b>Google 登入尚未啟用</b>
        <span>1. Firebase Console → Authentication → 啟用 Google 登入</span>
        <span>2. 專案設定 → 網頁應用程式，把設定填進 <code>.env</code> 的 <code>NUXT_PUBLIC_FIREBASE_*</code></span>
        <span>3. 服務帳戶 → 產生私密金鑰，base64 後填進 <code>NUXT_FIREBASE_SERVICE_ACCOUNT</code></span>
        <span>4. 重新啟動 <code>npm run dev</code></span>
      </div>
    </UiCard>

    <div class="divider-or">or</div>

    <UiButton variant="ghost" :disabled="loading" @click="loginAsDemo">先用 Demo 帳號看看</UiButton>
  </section>
</template>

<style scoped>
.login {
  justify-content: center;
  gap: 18px;
  padding-top: 64px;
}

.login__back {
  position: absolute;
  top: 16px;
  left: 12px;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  border-radius: 12px;
}

.login__role {
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
}

.login__role a {
  font-weight: 700;
}

.login__brand {
  margin-bottom: 6px;
}

.g-mark {
  display: grid;
  place-items: center;
}

.setup {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-soft);
  line-height: 1.5;
}

.setup code {
  background: var(--surface-sunken);
  padding: 1px 5px;
  border-radius: 5px;
  font-size: 12px;
  word-break: break-all;
}
</style>
