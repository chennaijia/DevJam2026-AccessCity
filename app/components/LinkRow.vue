<script setup lang="ts">
defineProps<{ label: string; value: string; to?: string }>()
</script>

<template>
  <UiCard :to="to" padding="14px 16px">
    <div class="row-between">
      <div>
        <div class="muted">{{ label }}</div>
        <div class="title-md">{{ value }}</div>
      </div>
      <span class="chev" aria-hidden="true">›</span>
    </div>
  </UiCard>
</template>

<style scoped>
.chev {
  font-size: 24px;
  color: var(--ink-soft);
  line-height: 1;
}
</style>
