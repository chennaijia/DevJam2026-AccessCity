<script setup lang="ts">
/** Mimo：AI 陪伴角色（企劃書中的 Agent 人格化形象） */
withDefaults(defineProps<{ size?: number }>(), { size: 56 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" role="img" aria-label="Mimo">
    <circle cx="32" cy="38" r="20" fill="#8fe3a4" stroke="#10120f" stroke-width="2" />
    <circle cx="32" cy="38" r="14" fill="#d9f7de" />
    <path d="M24 16c-6-4-14-3-16 2 5 5 12 5 16-2Z" fill="#6ec97f" stroke="#10120f" stroke-width="2" />
    <path d="M40 16c6-4 14-3 16 2-5 5-12 5-16-2Z" fill="#6ec97f" stroke="#10120f" stroke-width="2" />
    <path d="M32 20v6" stroke="#10120f" stroke-width="2" stroke-linecap="round" />
    <circle cx="26" cy="36" r="2.6" fill="#10120f" />
    <circle cx="38" cy="36" r="2.6" fill="#10120f" />
    <circle cx="21" cy="42" r="2.6" fill="#f4b6b0" opacity="0.9" />
    <circle cx="43" cy="42" r="2.6" fill="#f4b6b0" opacity="0.9" />
    <path d="M29 43c1.8 1.8 4.2 1.8 6 0" stroke="#10120f" stroke-width="2" stroke-linecap="round" fill="none" />
  </svg>
</template>
