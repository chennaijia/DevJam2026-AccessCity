<script setup lang="ts">
/**
 * 品牌標誌（輪椅 + 葉子的定位圖徽）。
 * 吉祥物 Mimo 是另一個角色，兩者不共用（見 MimoMascot.vue）。
 */
withDefaults(
  defineProps<{
    /** 圖徽高度 */
    size?: number
    /** 要不要一起顯示 Accessity 字樣 */
    text?: boolean
    /** stack = 圖徽在上、文字在下；inline = 並排 */
    layout?: 'inline' | 'stack'
    /** 文字大小 */
    textSize?: number
  }>(),
  { size: 28, text: true, layout: 'inline', textSize: 24 },
)
</script>

<template>
  <span class="logo" :class="`logo--${layout}`">
    <img
      src="/logo.png"
      alt="AccessCity"
      :style="{ height: `${size}px`, width: 'auto' }"
      class="logo__mark"
    />
    <span v-if="text" class="brand" :style="{ fontSize: `${textSize}px` }">AccessCity</span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.logo--stack {
  flex-direction: column;
  gap: 6px;
}

.logo__mark {
  display: block;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
