<script setup lang="ts">
/** 自動安全檢查未回覆 → Care Alert（企劃書 §4.7 Escalate） */
// TODO: 串接後端 —— GET /api/alerts（正式版由推播喚起這個頁面）
const { data: alerts } = await useAsyncData('alerts-safety', () => api.getAlerts())
const alert = computed(() => alerts.value?.find((a) => a.kind === 'safety-check'))
</script>

<template>
  <CareAlertView v-if="alert" :alert="alert" />
</template>
