<script setup lang="ts">
defineProps<{
  tone: 'yellow' | 'red'
  title: string
  message?: string
  tag?: string
}>()
</script>

<template>
  <div class="banner" :class="`banner--${tone}`">
    <div class="row" style="align-items: flex-start">
      <span class="banner__icon" aria-hidden="true">{{ tone === 'red' ? '⚠' : '!' }}</span>
      <div class="grow">
        <h2 class="title-lg">{{ title }}</h2>
        <p v-if="message" class="banner__msg">{{ message }}</p>
        <span v-if="tag" class="banner__tag">{{ tag }}</span>
      </div>
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.banner {
  padding: 16px 18px 18px;
}

.banner--yellow {
  background: var(--yellow);
}

.banner--red {
  background: var(--red);
  color: #fff;
}

.banner__icon {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.3;
}

.banner__msg {
  font-size: 14px;
  margin-top: 2px;
}

.banner__tag {
  display: inline-block;
  margin-top: 10px;
  padding: 5px 12px;
  background: var(--surface);
  color: var(--ink);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}
</style>
