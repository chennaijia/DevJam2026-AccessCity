<script setup lang="ts">
defineProps<{ title?: string; back?: boolean | string }>()

const router = useRouter()

function goBack(target: boolean | string | undefined) {
  if (typeof target === 'string') return navigateTo(target)
  router.back()
}
</script>

<template>
  <header class="head">
    <button v-if="back" type="button" class="head__back" aria-label="返回" @click="goBack(back)">
      ←
    </button>
    <span v-else class="head__spacer" />
    <h1 class="head__title">{{ title }}</h1>
    <span class="head__spacer" />
  </header>
</template>

<style scoped>
.head {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  padding-top: 4px;
}

.head__back {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  font-size: 22px;
  cursor: pointer;
  text-align: left;
}

.head__spacer {
  display: block;
}

.head__title {
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  color: var(--teal);
}
</style>
