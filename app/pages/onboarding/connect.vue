<script setup lang="ts">
const code = ref('')
const joined = ref(false)
const error = ref('')

// TODO: 串接後端 —— GET /api/family/invites（待接受的邀請）
const { data: family } = await useAsyncData('connect-family', () => api.getFamily())

async function connect() {
  error.value = ''
  // TODO: 串接後端 —— POST /api/family/join { code }
  const res = await api.joinFamily(code.value)
  if (res.ok) joined.value = true
  else error.value = '代碼不正確或已過期'
}

async function accept() {
  // TODO: 串接後端 —— POST /api/family/invites/:id/accept
  await api.acceptInvite('inv_1')
  joined.value = true
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

    <UiCard padding="16px">
      <div class="title-md">Enter Family Code</div>
      <p class="muted">Ask your caregiver for their 8-character code.</p>
      <input
        v-model="code"
        class="input"
        placeholder="AC------"
        style="margin: 10px 0; letter-spacing: 0.15em"
      />
      <UiButton @click="connect">Connect</UiButton>
      <p v-if="error" class="muted" style="color: var(--red); margin-top: 8px">{{ error }}</p>
    </UiCard>

    <div class="divider-or">or</div>

    <UiCard padding="16px">
      <UiChip tone="yellow">Pending</UiChip>
      <div class="row-between" style="margin-top: 10px">
        <div>
          <div class="title-md">Invitation from 陳乃嘉</div>
          <div class="muted">Family · {{ family?.code }}</div>
        </div>
        <UiChip as="button" tone="green" @click="accept">Accept</UiChip>
      </div>
    </UiCard>

    <UiCard variant="active" padding="14px 16px">
      <div class="row">
        <span class="avatar">乃</span>
        <div>
          <div class="muted">Connected Caregiver</div>
          <div class="title-md">陳乃嘉 {{ joined ? '· 已連結' : '' }}</div>
        </div>
      </div>
    </UiCard>

    <UiButton to="/map">Continue to Map</UiButton>
    <UiButton variant="quiet" to="/map">Skip for now</UiButton>
  </section>
</template>

<style scoped>
.avatar {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--green);
  border: 2px solid var(--line);
  display: grid;
  place-items: center;
  font-weight: 800;
}
</style>
