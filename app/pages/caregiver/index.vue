<script setup lang="ts">
// TODO: 串接後端 —— GET /api/family（成員狀態正式版建議用 SSE / WebSocket 即時更新）
const { data: family } = await useAsyncData('caregiver-family', () => api.getFamily())

const { members, load, select } = useCaregiver()
const { pending, load: loadAlerts } = useAlerts()
await load(true)
await loadAlerts()

/** 每位成員身上還沒處理的提醒數量 */
function alertsOf(memberId: string) {
  return pending.value.filter((a) => a.memberId === memberId).length
}

/** 點成員時同時把主頁的關注對象切過去 */
function openMember(id: string) {
  select(id)
  return navigateTo(`/caregiver/members/${id}`)
}
</script>

<template>
  <section class="screen screen--nav">
    <h1 class="head">Caregiver Dashboard</h1>

    <UiCard variant="active" padding="16px">
      <div class="label">Family</div>
      <div class="title-lg">{{ family?.name }}</div>
      <div class="muted">Family Code</div>
      <div class="row-between">
        <span class="code">{{ family?.code }}</span>
        <UiButton variant="outline" :block="false" to="/onboarding/family-code">Manage Code</UiButton>
      </div>
    </UiCard>

    <div class="label">Connected Members ({{ members?.length ?? 0 }})</div>

    <UiCard
      v-for="m in members"
      :key="m.id"
      padding="14px 16px"
      style="cursor: pointer"
      @click="openMember(m.id)"
    >
      <div class="row-between">
        <div class="row">
          <span class="avatar" :class="{ 'avatar--warn': m.status !== 'safe' }">{{ m.initial }}</span>
          <div>
            <div class="title-md">{{ m.name }}</div>
            <div class="muted">{{ m.needsLabel }}</div>
          </div>
        </div>
        <div class="row" style="gap: 6px">
          <UiChip v-if="alertsOf(m.id)" tone="red">{{ alertsOf(m.id) }} 則提醒</UiChip>
          <UiChip :tone="m.status === 'safe' ? 'green' : 'yellow'">{{ m.statusLabel }}</UiChip>
        </div>
      </div>

      <div style="margin-top: 10px">
        <div class="muted">Last location</div>
        <div style="font-weight: 700">{{ m.lastLocation }}</div>
      </div>

      <div class="row-between" style="margin-top: 6px">
        <span class="muted">Last activity</span>
        <span class="row" style="gap: 6px">
          <b style="font-size: 14px">{{ m.lastActivity }}</b>
          <span class="chev" aria-hidden="true">›</span>
        </span>
      </div>
    </UiCard>

    <UiButton variant="outline" to="/caregiver/alerts">提醒中心</UiButton>
    <UiButton variant="outline" to="/settings/notifications">Notification Rules</UiButton>
    <!-- TODO: 串接後端 —— POST /api/family/invites（寄出邀請） -->
    <UiButton to="/onboarding/family-code">Invite Member</UiButton>

    <BottomNav />
  </section>
</template>

<style scoped>
.head {
  text-align: center;
  color: var(--teal);
  font-size: 20px;
  font-weight: 800;
}

.code {
  font-size: 22px;
  font-weight: 800;
  color: var(--teal);
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

.avatar--warn {
  background: var(--yellow);
}

.chev {
  font-size: 22px;
  color: var(--ink-soft);
}
</style>
