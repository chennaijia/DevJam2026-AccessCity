<script setup lang="ts">
/** 照顧者：產生並分享 Family Code */
const { data: family, refresh } = await useAsyncData('family-code', () => api.getFamily())
const copied = ref(false)

async function copyCode() {
  // TODO: 正式版可加上 navigator.share（行動裝置分享面板）
  if (import.meta.client && family.value) {
    await navigator.clipboard?.writeText(family.value.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
}

async function regenerate() {
  // TODO: 串接後端 —— POST /api/family/code
  await api.regenerateFamilyCode()
  await refresh()
}
</script>

<template>
  <section class="screen">
    <ScreenHeader title="Accessity" back="/onboarding/role" />

    <div>
      <h2 class="title-xl">Your Family Code</h2>
      <p class="body">Share this code so the person you care for can connect to your family group.</p>
    </div>

    <UiCard padding="20px 16px">
      <div class="center">
        <div class="label">Family Code</div>
        <div class="code">{{ family?.code }}</div>
        <div class="muted">Expires in {{ family?.codeExpiresInDays }} days</div>
      </div>
    </UiCard>

    <div class="row">
      <UiButton variant="outline" @click="copyCode">{{ copied ? 'Copied!' : 'Copy Code' }}</UiButton>
      <UiButton>Share Code</UiButton>
    </div>

    <UiButton variant="ghost" @click="regenerate">Regenerate Code</UiButton>

    <div class="stack">
      <UiCard v-for="m in family?.members" :key="m.id" padding="14px 16px">
        <div class="row-between">
          <div class="row">
            <span class="avatar">{{ m.initial }}</span>
            <div>
              <div class="title-md">{{ m.name }}</div>
              <div class="muted">{{ m.needsLabel }}</div>
            </div>
          </div>
          <UiChip :tone="m.invitePending ? 'yellow' : 'green'">
            {{ m.invitePending ? 'Pending' : 'Active' }}
          </UiChip>
        </div>
      </UiCard>
    </div>

    <UiButton to="/caregiver">Go to Dashboard</UiButton>

    <p class="muted center">
      Anyone with this code can join your family group. Regenerate it if shared by mistake.
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
</style>
