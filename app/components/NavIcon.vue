<script setup lang="ts">
defineProps<{ name: 'map' | 'report' | 'home' | 'mimo' | 'profile' }>()
</script>

<template>
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'map'">
      <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3Z" />
      <path d="M9 3v15M15 6v15" />
    </template>
    <template v-else-if="name === 'report'">
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 10v4M12 17h.01" />
    </template>
    <template v-else-if="name === 'home'">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
    </template>
    <template v-else-if="name === 'mimo'">
      <rect x="3.5" y="6" width="17" height="14" rx="4" />
      <path d="M12 2v4M9 12h.01M15 12h.01M9.5 16h5" />
    </template>
    <template v-else>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5c1.4-3.6 4-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
    </template>
  </svg>
</template>
