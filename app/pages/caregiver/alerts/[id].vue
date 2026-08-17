<script setup lang="ts">
/** 單一提醒詳情：安全檢查未回覆、緊急求助、長時間停留都走這一頁 */
const route = useRoute()
const id = route.params.id as string

const { byId, load } = useAlerts()
await load()

const alert = computed(() => byId(id))
</script>

<template>
  <CareAlertView v-if="alert" :alert="alert" />

  <section v-else class="screen screen--nav">
    <ScreenHeader title="提醒" back="/caregiver/alerts" />
    <UiCard variant="soft" padding="20px 16px">
      <div class="center stack-sm">
        <div class="title-md">找不到這則提醒</div>
        <div class="muted">可能已經被其他家人處理掉了</div>
      </div>
    </UiCard>
    <UiButton variant="outline" to="/caregiver/alerts">回提醒中心</UiButton>
    <BottomNav />
  </section>
</template>
