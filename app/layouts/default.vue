<script setup lang="ts">
const { refresh } = usePush()

// 進站時只讀目前的權限狀態，不會跳出詢問視窗
onMounted(refresh)
</script>

<template>
  <div class="phone">
    <slot />
    <PushToast />
  </div>
</template>
