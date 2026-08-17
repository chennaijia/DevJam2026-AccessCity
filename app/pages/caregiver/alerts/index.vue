<script setup lang="ts">
/** 提醒中心：未處理與已處理的 Care Alert 一次看完 */
const { alerts, pending, load } = useAlerts()
await load(true)

const handled = computed(() => alerts.value.filter((a) => a.acknowledged))

const kindLabel: Record<string, string> = {
  'safety-check': '安全檢查未回覆',
  emergency: '緊急求助',
  stationary: '長時間停留',
}
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="提醒中心" back="/home" />

    <div class="label">待處理（{{ pending.length }}）</div>

    <UiCard
      v-for="a in pending"
      :key="a.id"
      :variant="a.kind === 'emergency' ? 'danger' : 'soft'"
      padding="14px 16px"
      :to="`/caregiver/alerts/${a.id}`"
    >
      <div class="row-between">
        <div class="row" style="gap: 10px">
          <span class="dot" :class="`dot--${a.kind}`"><AppIcon name="warn" :size="16" /></span>
          <div>
            <div class="title-md">{{ a.memberName }} · {{ kindLabel[a.kind] ?? a.title }}</div>
            <div class="muted">{{ a.message }}</div>
            <div class="muted">{{ a.location }} · {{ a.time }}</div>
          </div>
        </div>
        <span class="chev" aria-hidden="true">›</span>
      </div>
    </UiCard>

    <UiCard v-if="!pending.length" variant="soft" padding="20px 16px">
      <div class="center stack-sm" style="align-items: center">
        <span class="ok-dot"><AppIcon name="check" :size="22" /></span>
        <div class="title-md">目前沒有待處理的提醒</div>
        <div class="muted">有狀況時會即時通知你</div>
      </div>
    </UiCard>

    <template v-if="handled.length">
      <div class="label">已處理</div>
      <UiCard
        v-for="a in handled"
        :key="a.id"
        variant="soft"
        padding="12px 16px"
        :to="`/caregiver/alerts/${a.id}`"
      >
        <div class="row-between">
          <div>
            <div class="title-md" style="color: var(--ink-soft)">
              {{ a.memberName }} · {{ kindLabel[a.kind] ?? a.title }}
            </div>
            <div class="muted">{{ a.time }}</div>
          </div>
          <UiChip tone="green">已回覆</UiChip>
        </div>
      </UiCard>
    </template>

    <BottomNav />
  </section>
</template>

<style scoped>
.dot {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--yellow-soft);
  color: #8a6400;
  display: grid;
  place-items: center;
}

.dot--emergency {
  background: var(--red-soft);
  color: var(--red);
}

.ok-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--green-soft);
  color: var(--green-strong);
  display: grid;
  place-items: center;
}

.chev {
  font-size: 22px;
  color: var(--ink-soft);
}
</style>
