<script setup lang="ts">
/**
 * Mimo：AI 陪伴角色（企劃書中的 Agent 人格化形象）
 * 圖檔在 public/：小尺寸用 mimo-icon.png（96px），大尺寸用 mimo.png（384px）。
 * 之後要換插畫，直接換這兩個檔案即可。
 */
const props = withDefaults(defineProps<{ size?: number; alt?: string }>(), {
  size: 56,
  alt: 'Mimo',
})

const src = computed(() => (props.size > 96 ? '/mimo.png' : '/mimo-icon.png'))
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    :width="size"
    :height="size"
    class="mimo-img"
    :style="{ width: `${size}px`, height: `${size}px` }"
    decoding="async"
  />
</template>

<style scoped>
.mimo-img {
  display: block;
  object-fit: contain;
  flex: none;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
