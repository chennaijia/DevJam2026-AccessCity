<script setup lang="ts">
import type { NavIconName } from '#shared/types/nav'

const { isCaregiver } = useSession()
const { pending, load } = useAlerts()
const { unread, load: loadNotifications } = useNotifications()
const route = useRoute()

// 分頁紅點：照顧者看未處理提醒，被照顧者看未讀通知
if (isCaregiver.value) load()
else loadNotifications()

/**
 * 分頁依角色不同：
 * 被照顧者需要的是「找路 / 回報 / 求助」，照顧者需要的是「誰要注意 / 家人 / 提醒」。
 */
const items = computed<{ name: NavIconName; label: string; to: string; badge?: number }[]>(() =>
  isCaregiver.value
    ? [
        { name: 'home', label: 'Home', to: '/home' },
        { name: 'map', label: 'Members', to: '/caregiver' },
        { name: 'report', label: 'Alerts', to: '/caregiver/alerts', badge: pending.value.length },
        { name: 'mimo', label: 'Mimo', to: '/mimo' },
        { name: 'profile', label: 'Profile', to: '/profile' },
      ]
    : [
        { name: 'map', label: 'Map', to: '/map' },
        {
          name: 'bell',
          label: 'Notification',
          to: '/notifications',
          badge: unread.value.length,
        },
        { name: 'home', label: 'Home', to: '/home' },
        { name: 'mimo', label: 'Mimo', to: '/mimo' },
        { name: 'profile', label: 'Profile', to: '/profile' },
      ],
)

/**
 * 取最精確的一個分頁當作 active：
 * /caregiver/alerts 同時符合 Members(/caregiver) 與 Alerts(/caregiver/alerts)，
 * 沒有這段的話會亮錯分頁。
 */
const activeTo = computed(() => {
  const matched = items.value
    .filter((i) => route.path === i.to || route.path.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)
  return matched[0]?.to
})

function isActive(to: string) {
  return activeTo.value === to
}
</script>

<template>
  <nav class="nav" aria-label="主要導覽">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav__item"
      :class="{ 'nav__item--active': isActive(item.to) }"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <span class="nav__icon">
        <NavIcon :name="item.name" />
        <span v-if="item.badge" class="nav__badge" :aria-label="`${item.badge} 則未處理提醒`">
          {{ item.badge > 9 ? '9+' : item.badge }}
        </span>
      </span>
      <span class="nav__label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--screen-w);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  background: var(--surface);
  border-top: 1px solid var(--line);
  box-shadow: 0 -8px 24px rgba(16, 18, 15, 0.05);
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
  z-index: 40;
}

.nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 52px;
  padding: 4px 0 2px;
  border-radius: 14px;
  color: var(--muted);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

/* 只在圖示外圍給一顆膠囊，文字保持在下方，選中狀態更輕巧 */
.nav__icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 52px;
  height: 30px;
  border-radius: 999px;
  background: transparent;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.nav__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  transition: color 0.18s ease;
}

.nav__item--active .nav__icon {
  background: var(--green);
  color: #0d3a16;
}

.nav__item--active .nav__label {
  color: var(--teal);
  font-weight: 800;
}

/* 選中時線條略粗，讓圖示重量跟文字一致 */
.nav__item--active .nav__icon :deep(svg) {
  stroke-width: 2.2;
}

.nav__item:active .nav__icon {
  transform: scale(0.92);
}

.nav__item:focus-visible {
  outline: 3px solid var(--teal);
  outline-offset: 2px;
}

.nav__badge {
  position: absolute;
  top: -2px;
  right: 8px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--red);
  border: 2px solid var(--surface);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 13px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .nav__icon,
  .nav__label {
    transition: none;
  }
}
</style>
