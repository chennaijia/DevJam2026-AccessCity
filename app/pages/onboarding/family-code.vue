<script setup lang="ts">
/**
 * 被照顧者：我的連結代碼
 * 代碼由被照顧者持有——要不要讓人看到自己的位置，決定權在自己身上。
 */
const { setUser, needsOnboarding, completeOnboarding } = useSession()

const { data: family, refresh } = await useAsyncData('my-family-code', () => api.getFamily())

const copied = ref(false)
const working = ref(false)

const caregivers = computed(() => family.value?.caregivers ?? [])

async function copyCode() {
  if (!import.meta.client || !family.value) return
  try {
    await navigator.clipboard.writeText(family.value.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // 沒有剪貼簿權限就算了，代碼本來就顯示在畫面上
  }
}

async function share() {
  if (!import.meta.client || !family.value) return
  const text = `用這組代碼在 Accessity 連結我：${family.value.code}`
  // 行動裝置有系統分享面板，桌機退回複製
  if (navigator.share) await navigator.share({ text }).catch(() => {})
  else await copyCode()
}

async function regenerate() {
  working.value = true
  try {
    await api.regenerateFamilyCode()
    await refresh()
    setUser(await api.getMe())
  } finally {
    working.value = false
  }
}

async function finish() {
  if (needsOnboarding.value) await completeOnboarding()
  await navigateTo('/home')
}
</script>

<template>
  <section class="screen">
    <ScreenHeader title="Accessity" :back="needsOnboarding ? '/onboarding/needs' : '/profile'" />

    <div>
      <h2 class="title-xl">你的連結代碼</h2>
      <p class="body">把這組代碼給家人，他們就能在需要的時候看到你的狀況並提供協助。</p>
    </div>

    <UiCard padding="20px 16px">
      <div class="center">
        <div class="label">你的連結代碼</div>
        <div class="code">{{ family?.code }}</div>
        <div class="muted">{{ family?.codeExpiresInDays }} 天後失效</div>
      </div>
    </UiCard>

    <div class="row">
      <UiButton variant="outline" @click="copyCode">{{ copied ? '已複製！' : '複製代碼' }}</UiButton>
      <UiButton @click="share">分享代碼</UiButton>
    </div>

    <UiButton variant="ghost" :disabled="working" @click="regenerate">
      {{ working ? '產生中…' : '重新產生代碼' }}
    </UiButton>

    <div class="label">已連結的照顧者</div>

    <UiCard v-if="!caregivers.length" variant="soft" padding="16px">
      <div class="center stack-sm">
        <div class="title-md">還沒有人連結</div>
        <div class="muted">把代碼給家人，他們輸入之後就會出現在這裡</div>
      </div>
    </UiCard>

    <UiCard v-for="c in caregivers" :key="c.id" padding="14px 16px">
      <div class="row">
        <img v-if="c.avatar" :src="c.avatar" alt="" class="avatar avatar--photo" />
        <span v-else class="avatar">{{ c.name.slice(0, 1) }}</span>
        <div>
          <div class="title-md">{{ c.name }}</div>
          <div class="muted">可以看到你的行程與位置</div>
        </div>
      </div>
    </UiCard>

    <UiButton @click="finish">{{ needsOnboarding ? '完成，開始使用' : '回主頁' }}</UiButton>

    <p class="muted center">
      重新產生代碼後，還沒連結的人就無法再用舊代碼；已經連結的照顧者不受影響，
      需要解除時請由照顧者那端操作。
    </p>
  </section>
</template>

<style scoped>
.code {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--teal);
}

.avatar {
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--green);
  border: 2px solid var(--line);
  display: grid;
  place-items: center;
  font-weight: 800;
}

.avatar--photo {
  object-fit: cover;
  border: none;
}
</style>
