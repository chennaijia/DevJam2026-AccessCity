<script setup lang="ts">
withDefaults(
  defineProps<{ text: string; size?: number; tone?: 'white' | 'green'; hard?: boolean }>(),
  { size: 52, tone: 'white' },
)
</script>

<template>
  <div class="mimo">
    <div class="mimo__bubble" :class="[`mimo__bubble--${tone}`, { 'mimo__bubble--hard': hard }]">
      {{ text }}
    </div>
    <MimoMascot :size="size" />
  </div>
</template>

<style scoped>
.mimo {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.mimo__bubble {
  flex: 1;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 15px;
  font-weight: 600;
  box-shadow: var(--shadow-soft);
}

.mimo__bubble--green {
  background: var(--green-soft);
}

.mimo__bubble--hard {
  border: 2px solid var(--line-strong);
  box-shadow: var(--shadow-hard);
}
</style>
