<script setup lang="ts">
const { setUser, applyPendingRole, isCaregiver } = useSession()

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const agree = ref(false)
const loading = ref(false)

async function signup() {
  loading.value = true
  try {
    // TODO: 串接後端 —— POST /api/auth/signup（前端也要補：密碼一致、Email 格式、同意條款）
    const user = await api.signup({ name: form.name, email: form.email, password: form.password })
    setUser(user)
    // 身分在第一頁（/onboarding/welcome）就選好了，這裡直接套用
    await applyPendingRole()
    await navigateTo(isCaregiver.value ? '/onboarding/family-code' : '/onboarding/needs')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="screen">
    <ScreenHeader title="Create Account" back="/login" />
    <!-- 身分已在 /onboarding/welcome 選擇，註冊完成後直接進入需求設定 -->

    <div>
      <h2 class="title-xl">Let's get you set up</h2>
      <p class="body">You'll pick how you use Accessity next.</p>
    </div>

    <form class="stack" @submit.prevent="signup">
      <label class="field">
        <span>Full Name</span>
        <input v-model="form.name" class="input" placeholder="Kai Chuang" />
      </label>

      <label class="field">
        <span>Email</span>
        <input v-model="form.email" class="input" type="email" placeholder="you@example.com" />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="form.password" class="input" type="password" placeholder="At least 8 characters" />
      </label>

      <label class="field">
        <span>Confirm Password</span>
        <input v-model="form.confirm" class="input" type="password" placeholder="Re-enter password" />
      </label>

      <label class="checkbox-row">
        <input v-model="agree" type="checkbox" class="sr-only" />
        <span class="checkbox-box" aria-hidden="true">{{ agree ? '✓' : '' }}</span>
        <span>I agree to share location data only with caregivers I connect.</span>
      </label>

      <UiButton type="submit" :disabled="loading">Create Account</UiButton>
    </form>

    <p class="center muted">
      Already have an account?
      <NuxtLink to="/login" style="font-weight: 700">Log In</NuxtLink>
    </p>
  </section>
</template>
