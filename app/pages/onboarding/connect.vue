<script setup lang="ts">
/**
 * 照顧者：輸入家人給的連結代碼。
 * 代碼由被照顧者持有，所以這頁是「請對方給你代碼」，不是自己產生。
 */
const { setUser, needsOnboarding, completeOnboarding } = useSession()

const code = ref('')
const joining = ref(false)
const error = ref('')
const success = ref('')

// 已經連結的家人（照顧者可以同時連結多位）
const { data: family, refresh } = await useAsyncData('caregiver-connections', () =>
  api.getFamily().catch(() => null),
)

const connections = computed(() => family.value?.families ?? [])

const REASONS: Record<string, string> = {
  empty: '請先輸入代碼',
  'not-found': '找不到這組代碼，請跟家人確認',
  expired: '這組代碼已經過期了，請家人重新產生',
}

async function connect() {
  error.value = ''
  success.value = ''
  joining.value = true
  try {
    const res = await api.joinFamily(code.value)
    if (!res.ok) {
      error.value = REASONS[res.reason ?? 'not-found'] ?? '代碼不正確'
      return
    }
    success.value =
      res.reason === 'already'
        ? `已經連結過「${res.family?.name ?? '這位家人'}」`
        : `已成功連結「${res.family?.name ?? '家人'}」`
    code.value = ''
    await refresh()
    setUser(await api.getMe())
  } catch {
    success.value = ''
    error.value = '連線失敗，請再試一次'
  } finally {
    joining.value = false
  }
}

async function disconnect(familyId: string) {
  if (!confirm('解除後就看不到這位家人的狀況了，確定嗎？')) return
  success.value = ''
  await api.disconnectFamily({ familyId })
  await refresh()
  setUser(await api.getMe())
}

async function finish() {
  if (needsOnboarding.value) await completeOnboarding()
  await navigateTo('/home')
}
</script>

<template>
  <section class="screen">
    <ScreenHeader title="AccessCity" :back="needsOnboarding ? '/onboarding/role' : '/caregiver'" />

    <div>
      <h2 class="title-xl">連結你要照顧的家人</h2>
      <p class="body">
        請家人打開 AccessCity 的「你的連結代碼」，把 AC- 開頭的代碼給你，輸入後就能看到他的狀況。
      </p>
    </div>

    <UiCard padding="16px">
      <div class="title-md">輸入連結代碼</div>
      <input
        v-model="code"
        class="input"
        placeholder="AC-00000"
        style="margin: 10px 0; letter-spacing: 0.15em; text-transform: uppercase"
        @keyup.enter="connect"
      />
      <UiButton :disabled="joining" @click="connect">
        {{ joining ? '連結中…' : '連結家人' }}
      </UiButton>
      <p v-if="error" class="muted" style="color: var(--red); margin-top: 8px">{{ error }}</p>
      <p
        v-if="success"
        class="muted"
        role="status"
        style="color: var(--green-strong); margin-top: 8px; font-weight: 700"
      >
        <AppIcon name="check" :size="15" />
        {{ success }}
      </p>
    </UiCard>

    <div class="label">已連結的家人</div>

    <UiCard v-if="!connections.length" variant="soft" padding="16px">
      <div class="center stack-sm">
        <div class="title-md">還沒有連結任何人</div>
        <div class="muted">連結之後，這裡會顯示他們的即時狀況</div>
      </div>
    </UiCard>

    <UiCard v-for="f in connections" :key="f.id" padding="14px 16px">
      <div class="row-between">
        <div>
          <div class="title-md">{{ f.name }}</div>
          <div class="muted">{{ f.members.map((m) => m.name).join('、') || '尚無成員' }}</div>
        </div>
        <UiChip as="button" tone="red" @click="disconnect(f.id)">解除</UiChip>
      </div>
    </UiCard>

    <UiButton @click="finish">
      {{ connections.length ? '完成，開始使用' : '先跳過' }}
    </UiButton>
  </section>
</template>
