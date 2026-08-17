<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <UiCard padding="14px 16px">
    <div class="row-between">
      <div class="grow">
        <div class="title-md">{{ title }}</div>
        <div v-if="description" class="muted">{{ description }}</div>
      </div>
      <UiToggle v-model="model" :label="title" />
    </div>
  </UiCard>
</template>
