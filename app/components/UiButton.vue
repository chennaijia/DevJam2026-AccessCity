<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'outline' | 'green' | 'danger' | 'ghost' | 'quiet' | 'dark'
    /** 地圖／導航浮層上的按鈕：深色描邊 + 硬陰影（對應設計稿） */
    hard?: boolean
    /** 藥丸形（導航列的 Report Issue / End Trip） */
    pill?: boolean
    block?: boolean
    to?: string
    disabled?: boolean
  }>(),
  { variant: 'primary', block: true },
)
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'button'"
    :to="to"
    :disabled="disabled"
    class="btn"
    :class="[
      `btn--${variant}`,
      { 'btn--block': block, 'btn--disabled': disabled, 'btn--hard': hard, 'btn--pill': pill },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  padding: 14px 20px;
  border-radius: var(--radius-btn);
  border: 1px solid transparent;
  background: var(--surface);
  box-shadow: var(--shadow-card);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  transition:
    transform 0.06s ease,
    filter 0.12s ease;
}

.btn--block {
  width: 100%;
}

.btn:active:not(.btn--disabled) {
  transform: translateY(1px);
  filter: brightness(0.97);
}

.btn--primary {
  background: var(--teal);
  color: #fff;
}

.btn--outline {
  background: var(--surface);
  color: var(--teal);
  border-color: var(--teal);
}

.btn--green {
  background: var(--green);
  color: #0d3a16;
}

.btn--danger {
  background: var(--red);
  color: #fff;
}

.btn--dark {
  background: #12211f;
  color: #fff;
  border-radius: 999px;
  min-height: 44px;
  padding: 10px 20px;
}

.btn--ghost {
  background: var(--surface);
  border-color: var(--line);
  color: var(--ink-soft);
}

.btn--quiet {
  background: transparent;
  border: none;
  box-shadow: none;
  color: var(--teal);
  min-height: 40px;
}

.btn--pill {
  border-radius: 999px;
  min-height: 46px;
  padding: 12px 16px;
  font-size: 15px;
  white-space: nowrap;
}

/* 地圖浮層用：深色描邊 */
.btn--hard {
  border: 2px solid var(--line-strong);
  box-shadow: var(--shadow-hard);
}

.btn--hard:active:not(.btn--disabled) {
  transform: translate(2px, 3px);
  box-shadow: 0 0 0 var(--line-strong);
}

.btn--disabled {
  background: #e7e6e0;
  color: var(--muted);
  border-color: transparent;
  box-shadow: none;
  opacity: 1;
  cursor: not-allowed;
}
</style>
