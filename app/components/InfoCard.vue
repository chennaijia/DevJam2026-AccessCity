<script setup lang="ts">
defineProps<{ label: string; value: string }>()
</script>

<template>
  <UiCard padding="14px 16px">
    <div class="muted">{{ label }}</div>
    <div class="title-md">{{ value }}</div>
  </UiCard>
</template>
