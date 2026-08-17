<script setup lang="ts">
const { isLoggedIn, nextPath } = useSession()

// 入口就是登入頁；已登入的人由 nextPath() 決定要補走新手流程還是直接進主頁
await navigateTo(isLoggedIn.value ? nextPath() : '/login', { replace: true })
</script>

<template>
  <div class="screen" />
</template>
