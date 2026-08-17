<script setup lang="ts">
/** 「加入家庭」— 被照顧者用照顧者給的 Family Code 加入 */
const code = ref('')
const message = ref('')

async function join() {
  // TODO: 串接後端 —— POST /api/family/join { code }
  const res = await api.joinFamily(code.value)
  message.value = res.ok ? '已加入 Chuang Family' : '代碼不正確或已過期'
}

async function accept() {
  // TODO: 串接後端 —— POST /api/family/invites/:id/accept
  await api.acceptInvite('inv_1')
  message.value = '已接受邀請'
}
</script>

<template>
  <section class="screen">
    <ScreenHeader title="Accessity" back="/onboarding/connect" />

    <div>
      <h2 class="title-xl">Join your family</h2>
      <p class="body">Ask your caregiver for the Family Code they created, then enter it below.</p>
    </div>

    <div class="label">Family Code</div>
    <input v-model="code" class="input code-input" placeholder="AC------" />

    <UiButton @click="join">Join Family</UiButton>
    <p v-if="message" class="muted center">{{ message }}</p>

    <div class="divider-or">or</div>

    <UiCard padding="16px">
      <UiChip tone="yellow">Pending</UiChip>
      <div class="row-between" style="margin-top: 10px">
        <div>
          <div class="title-md">Invitation from 陳乃嘉</div>
          <div class="muted">Chuang Family · AC-72841</div>
        </div>
        <UiChip as="button" tone="green" @click="accept">Accept</UiChip>
      </div>
    </UiCard>

    <div class="label">Connected</div>

    <UiCard variant="active" padding="14px 16px">
      <div class="row">
        <span class="avatar">乃</span>
        <div>
          <div class="muted">Connected caregiver</div>
          <div class="title-md">陳乃嘉</div>
        </div>
      </div>
    </UiCard>

    <UiButton to="/map">Continue to Map</UiButton>
    <UiButton variant="quiet" to="/map">Skip for now</UiButton>
  </section>
</template>

<style scoped>
.code-input {
  text-align: center;
  font-size: 24px;
  letter-spacing: 0.3em;
  font-weight: 800;
}

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
