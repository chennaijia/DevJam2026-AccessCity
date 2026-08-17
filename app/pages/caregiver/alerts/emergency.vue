<script setup lang="ts">
/** 使用者主動按下 SOS → 立即通知照顧者 */
// TODO: 串接後端 —— GET /api/alerts（正式版由推播喚起這個頁面）
const { data: alerts } = await useAsyncData('alerts-emergency', () => api.getAlerts())
const alert = computed(() => alerts.value?.find((a) => a.kind === 'emergency'))
</script>

<template>
  <CareAlertView v-if="alert" :alert="alert" />
</template>
