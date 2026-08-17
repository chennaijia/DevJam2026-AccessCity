<script setup lang="ts">
import type { NavIconName } from '#shared/types/nav'

const { isCaregiver } = useSession()
const route = useRoute()

/**
 * 照顧者的未處理提醒數量 → 顯示在 Profile 分頁的紅點。
 * TODO: 串接後端 —— GET /api/alerts（正式版改推播 / SSE 主動更新）
 */
const { data: alerts } = useAsyncData('nav-alerts', () => api.getAlerts())
const alertCount = computed(() =>
  isCaregiver.value ? (alerts.value?.filter((a) => !a.acknowledged).length ?? 0) : 0,
)

const items = computed<{ name: NavIconName; label: string; to: string; badge?: number }[]>(() => [
  { name: 'map', label: 'Map', to: '/map' },
  { name: 'report', label: 'Report', to: '/report' },
  { name: 'home', label: 'Home', to: '/home' },
  { name: 'mimo', label: 'Mimo', to: '/mimo' },
  {
    name: 'profile',
    label: 'Profile',
    to: isCaregiver.value ? '/caregiver' : '/profile',
    badge: alertCount.value,
  },
])

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
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
