<script setup lang="ts">
/** 主頁：依角色顯示不同內容 */
const { isCaregiver, user, ensureUser } = useSession()
await ensureUser()
</script>

<template>
  <CaregiverHome v-if="isCaregiver" />
  <RecipientHome v-else :user="user" />
</template>
