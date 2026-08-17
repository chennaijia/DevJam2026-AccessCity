<script setup lang="ts">
/** 被照顧者：用照顧者給的家庭代碼連結彼此 */
const { user, setUser, needsOnboarding, completeOnboarding } = useSession()

const code = ref('')
const joining = ref(false)
const error = ref('')
const joinedFamily = ref<string | null>(null)

const connected = computed(() => !!joinedFamily.value || !!user.value?.familyId)

const REASONS: Record<string, string> = {
  empty: '請先輸入代碼',
  'not-found': '找不到這個代碼，請跟照顧者確認',
  expired: '這個代碼已經過期了，請照顧者重新產生',
}

async function connect() {
  error.value = ''
  joining.value = true
  try {
    const res = await api.joinFamily(code.value)
    if (!res.ok) {
      error.value = REASONS[res.reason ?? 'not-found'] ?? '代碼不正確'
      return
    }
    joinedFamily.value = res.family?.name ?? '家庭'
    // 重新拿一次自己的資料，Profile 與導覽列才會同步
    setUser(await api.getMe())
  } catch {
    error.value = '連線失敗，請再試一次'
  } finally {
    joining.value = false
  }
}

/** 新手流程的最後一步：不管有沒有連結照顧者，都算走完 */
async function finish() {
  if (needsOnboarding.value) await completeOnboarding()
  await navigateTo('/home')
}

async function leave() {
  await api.leaveFamily()
  joinedFamily.value = null
  setUser(await api.getMe())
}
</script>

<template>
  <section class="screen">
    <ScreenHeader title="Accessity" back="/onboarding/needs" />

    <div>
      <h2 class="title-xl">Connect with a caregiver</h2>
      <p class="body">
        Optional. A caregiver can see your location during trips and get alerts if something looks
        wrong.
      </p>
    </div>

    <!-- 還沒連結：輸入代碼 -->
    <UiCard v-if="!connected" padding="16px">
      <div class="title-md">Enter Family Code</div>
      <p class="muted">跟你的照顧者拿 AC- 開頭的代碼</p>
      <input
        v-model="code"
        class="input"
        placeholder="AC-00000"
        style="margin: 10px 0; letter-spacing: 0.15em; text-transform: uppercase"
        @keyup.enter="connect"
      />
      <UiButton :disabled="joining" @click="connect">
        {{ joining ? '連結中…' : 'Connect' }}
      </UiButton>
      <p v-if="error" class="muted" style="color: var(--red); margin-top: 8px">{{ error }}</p>
    </UiCard>

    <!-- 已連結 -->
    <UiCard v-else variant="active" padding="16px">
      <div class="row" style="gap: 10px">
        <span class="avatar"><AppIcon name="check" :size="20" /></span>
        <div class="grow">
          <div class="muted">已連結家庭</div>
          <div class="title-md">{{ joinedFamily ?? user?.familyCode }}</div>
        </div>
      </div>
      <p class="muted" style="margin-top: 10px">
        行程中的位置會分享給這個家庭的照顧者，遇到狀況時他們會收到通知。
      </p>
      <UiButton variant="ghost" style="margin-top: 10px" @click="leave">離開家庭</UiButton>
    </UiCard>

    <UiButton @click="finish">{{ connected ? '完成，開始使用' : 'Continue to Map' }}</UiButton>
    <UiButton v-if="!connected" variant="quiet" @click="finish">Skip for now</UiButton>
  </section>
</template>

<style scoped>
.avatar {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--green-soft);
  color: var(--green-strong);
  display: grid;
  place-items: center;
}
</style>
