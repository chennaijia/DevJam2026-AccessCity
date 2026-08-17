<script setup lang="ts">
withDefaults(
  defineProps<{
    /** soft = 一般白卡；active = 主色描邊（被選中／推薦）；danger = 警示；outline = 地圖浮層用的深色描邊 */
    variant?: 'soft' | 'hard' | 'active' | 'danger' | 'outline'
    padding?: string
    to?: string
  }>(),
  { variant: 'soft', padding: '16px' },
)
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'div'"
    :to="to"
    class="card"
    :class="[`card--${variant}`, { 'card--link': to }]"
    :style="{ padding }"
  >
    <slot />
  </component>
</template>

<style scoped>
.card {
  display: block;
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  color: inherit;
}

/* hard 是舊名稱，現在與 soft 相同，避免頁面大量改動 */
.card--hard {
  box-shadow: var(--shadow-soft);
}

.card--active {
  border: 1.5px solid var(--teal);
  box-shadow: var(--shadow-soft);
}

.card--danger {
  border: 1px solid #f0c4c0;
  background: var(--red-soft);
  box-shadow: none;
}

.card--outline {
  border: 2px solid var(--line-strong);
  box-shadow: var(--shadow-hard);
}

.card--link {
  cursor: pointer;
}
</style>
