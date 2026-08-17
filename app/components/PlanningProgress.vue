<script setup lang="ts">
/**
 * 路線規劃進行中的過程面板。
 *
 * 誠實原則：畫面上的「進行中」是依序推進的節奏提示，
 * 但每一步的**結果與耗時**都來自後端真實回傳的 trace（見 /api/routes 的 trace），
 * 規劃完成後會把真實數據換上去，不會顯示編造的結果。
 */
import type { PlanTraceStep } from '#shared/types/accessity'

const props = defineProps<{ open: boolean; trace: PlanTraceStep[] }>()

/** 預期會經過的階段，用來在等待期間顯示目前跑到哪 */
const STAGES = [
  { key: 'place', label: '解析目的地', source: 'Google Places' },
  { key: 'routes', label: '取得候選步行路線', source: 'Google Routes' },
  { key: 'accessibility', label: '比對沿線無障礙設施', source: '臺北市無障礙通行資料' },
  { key: 'construction', label: '比對道路施工資料', source: '臺北市道路挖掘資料' },
  { key: 'detour', label: '嘗試自動繞開封閉路段', source: 'Google Routes' },
  { key: 'agent', label: 'AI 挑選推薦路線並說明原因', source: 'Gemini Agent' },
]

const activeIndex = ref(0)
let ticker: ReturnType<typeof setInterval> | undefined

watch(
  () => props.open,
  (open) => {
    clearInterval(ticker)
    if (!open) return
    activeIndex.value = 0
    // 每 1.1 秒往前推一格，最多停在最後一格等結果
    ticker = setInterval(() => {
      if (activeIndex.value < STAGES.length - 1) activeIndex.value += 1
    }, 1100)
  },
  { immediate: true },
)

onBeforeUnmount(() => clearInterval(ticker))

const finished = computed(() => props.trace.length > 0)
const totalMs = computed(() => props.trace.reduce((sum, step) => sum + step.ms, 0))

/** 後端已經回報的那一步（有真實結果） */
function resultOf(key: string) {
  return props.trace.find((t) => t.key === key)
}

function stateOf(key: string, index: number) {
  if (resultOf(key)) return 'done'
  return index <= activeIndex.value ? 'running' : 'waiting'
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="planning" role="status" aria-live="polite">
      <div class="planning__panel">
        <MimoMascot :size="64" />
        <h2 class="title-lg center">{{ finished ? '規劃完成' : '正在幫你規劃路線' }}</h2>
        <p class="muted center">
          {{ finished ? `共 ${totalMs} 毫秒，資料來源都列在下面` : '依你的需求逐項確認，找出真的走得到的路' }}
        </p>

        <ol class="steps">
          <li
            v-for="(stage, index) in STAGES"
            :key="stage.key"
            class="step"
            :class="`step--${stateOf(stage.key, index)}`"
          >
            <span class="step__dot">
              <AppIcon
                v-if="resultOf(stage.key)"
                :name="resultOf(stage.key)!.status === 'skipped' ? 'close' : 'check'"
                :size="13"
              />
              <span v-else class="step__spinner" />
            </span>

            <span class="grow">
              <span class="step__label">{{ stage.label }}</span>
              <span class="step__source">{{ resultOf(stage.key)?.source ?? stage.source }}</span>
              <!-- 真實結果，等後端回來才會出現 -->
              <span v-if="resultOf(stage.key)?.detail" class="step__detail">
                {{ resultOf(stage.key)!.detail }}
              </span>

              <!-- 各資料來源實際印出的訊息（呼叫了哪支 API、抓到幾筆、比對結果） -->
              <span v-if="resultOf(stage.key)?.logs?.length" class="step__logs">
                <span v-for="(line, i) in resultOf(stage.key)!.logs" :key="i" class="step__log">
                  {{ line }}
                </span>
              </span>
            </span>

            <span v-if="resultOf(stage.key)" class="step__ms">
              {{ resultOf(stage.key)!.ms }}ms
            </span>
          </li>
        </ol>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.planning {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(16, 18, 15, 0.45);
}

.planning__panel {
  width: 100%;
  max-width: 340px;
  padding: 22px 18px 18px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-lift);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.steps {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.step--running {
  background: var(--teal-tint);
}

.step__dot {
  flex: none;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e7e6e0;
  color: var(--muted);
}

.step--done .step__dot {
  background: var(--green-soft);
  color: var(--green-strong);
}

.step--running .step__dot {
  background: var(--teal);
  color: #fff;
}

.step__spinner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

.step--waiting .step__spinner {
  animation: none;
  border-style: dotted;
  opacity: 0.5;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.step__label {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.step--waiting .step__label {
  color: var(--muted);
  font-weight: 600;
}

.step__source {
  display: block;
  font-size: 11px;
  color: var(--muted);
}

.step__detail {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--teal);
  font-weight: 600;
}

.step__logs {
  display: block;
  margin-top: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #10120f;
  color: #b9f5c6;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  line-height: 1.6;
  max-height: 96px;
  overflow-y: auto;
}

.step__log {
  display: block;
  white-space: pre;
  overflow-x: auto;
}

.step__ms {
  flex: none;
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .step__spinner {
    animation: none;
  }
}
</style>
