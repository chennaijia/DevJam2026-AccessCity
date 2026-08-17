<script setup lang="ts">
/**
 * 規劃過程紀錄（結果頁用）。
 * 資料全部來自後端 /api/routes 回傳的 trace，包含每一步的資料來源、結果與實際耗時。
 */
import type { PlanTraceStep } from '#shared/types/accessity'

const props = defineProps<{ trace: PlanTraceStep[] }>()

const open = ref(false)
const totalMs = computed(() => props.trace.reduce((sum, step) => sum + step.ms, 0))
const doneCount = computed(() => props.trace.filter((s) => s.status === 'done').length)
</script>

<template>
  <UiCard v-if="trace.length" variant="soft" padding="12px 14px">
    <button type="button" class="head" @click="open = !open">
      <span class="row" style="gap: 8px">
        <AppIcon name="activity" :size="16" />
        <span class="title-md">規劃過程</span>
      </span>
      <span class="row" style="gap: 8px">
        <span class="muted">{{ doneCount }} 個步驟 · {{ (totalMs / 1000).toFixed(1) }}s</span>
        <span class="chev" :class="{ 'chev--open': open }">›</span>
      </span>
    </button>

    <ol v-if="open" class="list">
      <li v-for="step in trace" :key="step.key" class="item" :class="`item--${step.status}`">
        <span class="dot">
          <AppIcon :name="step.status === 'skipped' ? 'close' : 'check'" :size="12" />
        </span>
        <span class="grow">
          <span class="label">{{ step.label }}</span>
          <span v-if="step.source" class="source">{{ step.source }}</span>
          <span v-if="step.detail" class="detail">{{ step.detail }}</span>

          <!-- 實際的執行訊息，讓人看得到資料是從哪裡、抓了多少 -->
          <span v-if="step.logs?.length" class="logs">
            <span v-for="(line, i) in step.logs" :key="i" class="log">{{ line }}</span>
          </span>
        </span>
        <span v-if="step.status === 'done'" class="ms">{{ step.ms }}ms</span>
      </li>
    </ol>
  </UiCard>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
}

.chev {
  font-size: 20px;
  color: var(--ink-soft);
  transition: transform 0.15s ease;
}

.chev--open {
  transform: rotate(90deg);
}

.list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.dot {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--green-soft);
  color: var(--green-strong);
}

.item--skipped .dot {
  background: #eceae4;
  color: var(--muted);
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 700;
}

.item--skipped .label {
  color: var(--muted);
  font-weight: 600;
}

.source {
  display: block;
  font-size: 11px;
  color: var(--muted);
}

.detail {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--ink-soft);
}

.logs {
  display: block;
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #10120f;
  color: #b9f5c6;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  line-height: 1.7;
  overflow-x: auto;
}

.log {
  display: block;
  white-space: pre;
}

.ms {
  flex: none;
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
</style>
