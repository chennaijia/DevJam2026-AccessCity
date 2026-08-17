<script setup lang="ts">
/** 通知中心（被照顧者端）：Check-in 詢問、照顧者回覆、路線調整、抵達通知… */
import type { NotificationKind } from '#shared/types/accessity'

const { items, unread, load, markRead, markAllRead } = useNotifications()
await load(true)

const showUnreadOnly = ref(false)
const visible = computed(() => (showUnreadOnly.value ? unread.value : items.value))

const iconOf: Record<NotificationKind, string> = {
  'check-in': 'warn',
  caregiver: 'shield',
  route: 'pin',
  arrival: 'check',
  invite: 'share',
  system: 'info',
}

function open(id: string, to?: string) {
  markRead(id)
  if (to) return navigateTo(to)
}
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="通知" back="/home" />

    <div class="row-between">
      <div>
        <h2 class="title-xl">通知</h2>
        <p class="body">{{ unread.length ? `有 ${unread.length} 則還沒看` : '都看過了' }}</p>
      </div>
      <UiButton v-if="unread.length" variant="quiet" :block="false" @click="markAllRead">
        全部已讀
      </UiButton>
    </div>

    <div class="row">
      <UiChip as="button" :selected="!showUnreadOnly" @click="showUnreadOnly = false">全部</UiChip>
      <UiChip as="button" :selected="showUnreadOnly" @click="showUnreadOnly = true">
        未讀{{ unread.length ? `（${unread.length}）` : '' }}
      </UiChip>
    </div>

    <UiCard
      v-for="n in visible"
      :key="n.id"
      :variant="n.read ? 'soft' : 'active'"
      padding="14px 16px"
      style="cursor: pointer"
      @click="open(n.id, n.actionTo)"
    >
      <div class="row" style="align-items: flex-start; gap: 12px">
        <span class="dot" :class="`dot--${n.kind}`">
          <AppIcon :name="iconOf[n.kind] as never" :size="17" />
        </span>
        <div class="grow">
          <div class="row-between">
            <span class="title-md">{{ n.title }}</span>
            <span class="muted">{{ n.time }}</span>
          </div>
          <p class="body" style="font-size: 14px">{{ n.message }}</p>
          <div v-if="n.actionLabel" class="action">{{ n.actionLabel }} ›</div>
        </div>
        <span v-if="!n.read" class="unread" aria-label="未讀" />
      </div>
    </UiCard>

    <UiCard v-if="!visible.length" variant="soft" padding="24px 16px">
      <div class="center stack-sm" style="align-items: center">
        <span class="ok-dot"><AppIcon name="check" :size="22" /></span>
        <div class="title-md">沒有通知</div>
        <div class="muted">有新的狀況我會提醒你</div>
      </div>
    </UiCard>

    <UiButton variant="outline" to="/settings/notifications">通知設定</UiButton>
    <!-- 路況回報從分頁移到這裡，導航頁的「Report Issue」也還是走同一頁 -->
    <UiButton variant="quiet" to="/report">回報路況問題</UiButton>

    <BottomNav />
  </section>
</template>

<style scoped>
.dot {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--teal-tint);
  color: var(--teal);
  display: grid;
  place-items: center;
}

.dot--check-in {
  background: var(--yellow-soft);
  color: #8a6400;
}

.dot--arrival {
  background: var(--green-soft);
  color: var(--green-strong);
}

.action {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--teal);
}

.unread {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--red);
  margin-top: 6px;
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
</style>
