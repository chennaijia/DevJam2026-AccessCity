<script setup lang="ts">
const { setUser, applyPendingRole, homePath, pendingRole } = useSession()

/** 第一頁選的身分，讓使用者知道自己正以什麼身分登入，也可以退回去改 */
const roleLabel = computed(() =>
  pendingRole.value === 'caregiver' ? '照顧者' : pendingRole.value ? '被照顧者' : '',
)

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  error.value = ''
  loading.value = true
  try {
    // TODO: 串接後端 —— api.login() 內已備好 POST /api/auth/login
    const user = await api.login(email.value || 'kai@example.com', password.value)
    setUser(user)
    // 套用歡迎頁選的身分，再依身分進主頁
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
    <button type="button" class="login__back" aria-label="返回選擇身分" @click="navigateTo('/onboarding/welcome')">
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

    <form class="stack" @submit.prevent="login">
      <label class="field">
        <span>Email</span>
        <input v-model="email" class="input" type="email" placeholder="you@example.com" />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="password" class="input" type="password" placeholder="••••••••" />
      </label>

      <div style="text-align: right">
        <!-- TODO: 串接後端 —— POST /api/auth/forgot-password -->
        <NuxtLink to="/login" class="muted" style="color: var(--teal); font-weight: 700">
          Forgot Password?
        </NuxtLink>
      </div>

      <p v-if="error" class="body" style="color: var(--red)">{{ error }}</p>

      <UiButton type="submit" :disabled="loading">{{ loading ? '登入中…' : 'Log In' }}</UiButton>

      <div class="divider-or">or</div>

      <UiButton variant="outline" to="/signup">Sign Up</UiButton>
    </form>

    <p class="muted center">New here? Signing up takes less than a minute.</p>
  </section>
</template>

<style scoped>
.login {
  justify-content: center;
  gap: 22px;
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
</style>
