<script setup lang="ts">
const { isLoggedIn, homePath } = useSession()

// 入口：未登入 → 先選身分（歡迎頁），已登入 → 依身分進主頁
await navigateTo(isLoggedIn.value ? homePath.value : '/onboarding/welcome', { replace: true })
</script>

<template>
  <div class="screen" />
</template>
