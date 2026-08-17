<script setup lang="ts">
const { refresh } = usePush()

// 進站時只讀目前的權限狀態，不會跳出詢問視窗
onMounted(refresh)
</script>

<template>
  <div class="phone">
    <slot />
    <PushToast />
    <!-- 緊急求助不能只躺在通知清單，任何頁面都要跳出來 -->
    <EmergencyAlertModal />
  </div>
</template>
