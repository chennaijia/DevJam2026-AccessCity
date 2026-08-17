<script setup lang="ts">
import type { NavIconName } from '#shared/types/nav'

const { isCaregiver } = useSession()
const route = useRoute()

const items = computed<{ name: NavIconName; label: string; to: string }[]>(() => [
  { name: 'map', label: 'Map', to: '/map' },
  { name: 'report', label: 'Report', to: '/report' },
  { name: 'home', label: 'Home', to: '/home' },
  { name: 'mimo', label: 'Mimo', to: '/mimo' },
  { name: 'profile', label: 'Profile', to: isCaregiver.value ? '/caregiver' : '/profile' },
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
    >
      <NavIcon :name="item.name" />
      <span>{{ item.label }}</span>
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
  background: var(--surface);
  border-top: 1px solid var(--line-soft);
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
  z-index: 40;
}

.nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 0;
  border-radius: 12px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 600;
}

.nav__item--active {
  background: var(--green);
  color: #0d3a16;
  font-weight: 800;
}
</style>
