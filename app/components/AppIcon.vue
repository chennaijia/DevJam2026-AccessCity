<script setup lang="ts">
/** 單色線性圖示集（避免 emoji 在不同平台顏色不一致） */
withDefaults(
  defineProps<{
    name:
      | 'search'
      | 'mic'
      | 'bell'
      | 'menu'
      | 'layers'
      | 'wheelchair'
      | 'shield'
      | 'house'
      | 'share'
      | 'info'
      | 'warn'
      | 'walk'
      | 'close'
      | 'sound'
      | 'mute'
      | 'chart'
      | 'activity'
      | 'clock'
      | 'history'
      | 'pin'
      | 'check'
      | 'plus'
    size?: number
  }>(),
  { size: 20 },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    style="flex: none"
  >
    <template v-if="name === 'search'">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </template>
    <template v-else-if="name === 'mic'">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M6.5 9a5.5 5.5 0 0 1 11 0c0 5 2 6.5 2 6.5H4.5S6.5 14 6.5 9Z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0" />
    </template>
    <template v-else-if="name === 'menu'">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </template>
    <template v-else-if="name === 'layers'">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 14 9 5 9-5" />
    </template>
    <template v-else-if="name === 'wheelchair'">
      <circle cx="14" cy="4.2" r="1.8" />
      <path d="M12.5 8v6h4l3 5" />
      <circle cx="10.5" cy="16.5" r="4.5" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 3 5 6v5.5c0 4.4 3 7.6 7 9.5 4-1.9 7-5.1 7-9.5V6l-7-3Z" />
      <path d="M12 9v5M9.5 11.5h5" />
    </template>
    <template v-else-if="name === 'house'">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
    </template>
    <template v-else-if="name === 'share'">
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4" />
    </template>
    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </template>
    <template v-else-if="name === 'warn'">
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 10v4M12 17h.01" />
    </template>
    <template v-else-if="name === 'walk'">
      <circle cx="13" cy="4" r="1.8" />
      <path d="M11 21l1.5-6-3-2.5 1-4.5 3 3 3 1M10.5 12.5 8 21" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="m6 6 12 12M18 6 6 18" />
    </template>
    <template v-else-if="name === 'sound'">
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
    </template>
    <template v-else-if="name === 'mute'">
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5Z" />
      <path d="m16 9.5 4 5M20 9.5l-4 5" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 18V9M9.5 18V5M15 18v-6M20.5 18V8" />
    </template>
    <template v-else-if="name === 'activity'">
      <path d="M2 12.5h4l2.5-7 4 13 2.5-6h7" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.4l3.2 2" />
    </template>
    <template v-else-if="name === 'history'">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3 4v4.5h4.5" />
      <path d="M12 7.5V12l3 1.8" />
    </template>
    <template v-else-if="name === 'pin'">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </template>
    <template v-else>
      <path d="M12 5v14M5 12h14" />
    </template>
  </svg>
</template>
