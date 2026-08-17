<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'plain' | 'green' | 'green-solid' | 'yellow' | 'red' | 'teal' | 'grey'
    /** 地圖浮層上的 chip：深色描邊 */
    hard?: boolean
    selected?: boolean
    as?: 'span' | 'button'
  }>(),
  { tone: 'plain', as: 'span' },
)
</script>

<template>
  <component
    :is="as"
    class="chip"
    :class="[`chip--${tone}`, { 'chip--selected': selected, 'chip--hard': hard }]"
  >
    <slot />
  </component>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: inherit;
}

button.chip {
  cursor: pointer;
}

.chip--green {
  background: var(--green-soft);
  border-color: #b7e8c0;
  color: #14632f;
}

.chip--green-solid {
  background: var(--green-strong);
  border-color: var(--green-strong);
  color: #fff;
}

.chip--yellow {
  background: var(--yellow);
  border-color: #e0a400;
  color: #3a2c00;
}

.chip--red {
  background: var(--red-soft);
  border-color: #f2c7c3;
  color: var(--red);
}

.chip--teal {
  background: var(--teal);
  border-color: var(--teal);
  color: #fff;
}

.chip--grey {
  background: var(--surface);
  border-color: var(--line);
  color: var(--ink-soft);
  font-weight: 600;
}

.chip--selected {
  background: var(--green);
  border-color: #7fd894;
  color: #0d3a16;
}

.chip--hard {
  border: 2px solid var(--line-strong);
  box-shadow: var(--shadow-hard);
}
</style>
