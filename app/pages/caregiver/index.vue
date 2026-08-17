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
    <h1 class="head">照顧者總覽</h1>

    <!-- 代碼是被照顧者持有的，照顧者這裡只顯示連結狀態 -->
    <UiCard variant="active" padding="16px">
      <div class="label">已連結</div>
      <div class="title-lg">{{ members?.length ?? 0 }} 位家人</div>
      <div class="row-between" style="margin-top: 8px">
        <span class="muted">{{ family?.name || '用家人給的代碼建立連結' }}</span>
        <UiButton variant="outline" :block="false" to="/onboarding/connect">管理連結</UiButton>
      </div>
    </UiCard>

    <div class="label">已連結的家人（{{ members?.length ?? 0 }}）</div>

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
        <div class="muted">最後位置</div>
        <div style="font-weight: 700">{{ m.lastLocation }}</div>
      </div>

      <div class="row-between" style="margin-top: 6px">
        <span class="muted">最後活動</span>
        <span class="row" style="gap: 6px">
          <b style="font-size: 14px">{{ m.lastActivity }}</b>
          <span class="chev" aria-hidden="true">›</span>
        </span>
      </div>
    </UiCard>

    <UiButton variant="outline" to="/caregiver/alerts">提醒中心</UiButton>
    <UiButton variant="outline" to="/settings/notifications">通知規則</UiButton>
    <UiButton to="/onboarding/connect">＋ 連結新的家人</UiButton>

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
