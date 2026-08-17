<script setup lang="ts">
/**
 * 可拖曳的 bottom sheet（地圖類畫面用）
 *
 * - 疊在地圖上方，地圖不會跟著捲動
 * - 抓握把或標題列可以上下拖，放開後吸附到最近的停留點
 * - 點一下握把在最小 / 最大之間切換
 * - 內容區自己捲動，`overscroll-behavior: contain` 讓捲到底不會帶動整頁
 */
const props = withDefaults(
  defineProps<{
    /** 停留點：佔視窗高度的比例，由小到大 */
    snapPoints?: number[]
    /** 起始停留點的 index */
    initial?: number
    /** 拖曳把手要不要顯示 */
    handle?: boolean
  }>(),
  { snapPoints: () => [0.42, 0.88], initial: 0, handle: true },
)

const emit = defineEmits<{ snap: [index: number] }>()

const height = ref(0)
const dragging = ref(false)
const contentEl = ref<HTMLElement | null>(null)

let viewportHeight = 0
let startY = 0
let startHeight = 0
/** 這次按下之後有沒有真的拖動過（用來擋掉拖曳結束時多出來的 click） */
let moved = false

const snapHeights = () => props.snapPoints.map((point) => Math.round(viewportHeight * point))
const minHeight = () => Math.min(...snapHeights())
const maxHeight = () => Math.max(...snapHeights())

function currentIndex() {
  const heights = snapHeights()
  let best = 0
  heights.forEach((h, i) => {
    if (Math.abs(h - height.value) < Math.abs(heights[best]! - height.value)) best = i
  })
  return best
}

function snapTo(index: number) {
  const heights = snapHeights()
  const target = heights[Math.max(0, Math.min(index, heights.length - 1))]!
  height.value = target
  emit('snap', index)
}

function measure() {
  viewportHeight = window.innerHeight
  height.value = snapHeights()[props.initial] ?? minHeight()
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  onPointerUp()
})

/* --------------------------------------------------------------- 拖曳 */

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  moved = false
  startY = event.clientY
  startHeight = height.value

  // 監聽整個 window：手指／游標拖出把手範圍時才不會斷掉
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  event.preventDefault()

  const delta = event.clientY - startY
  if (Math.abs(delta) > 4) moved = true

  // 往上拖 = 變高
  const next = startHeight - delta
  height.value = Math.max(minHeight(), Math.min(maxHeight(), next))
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)

  // 吸附到最近的停留點
  snapTo(currentIndex())
}

/** 點一下把手：在最小與最大之間切換（拖曳結束時瀏覽器也會補一次 click，要擋掉） */
function toggle() {
  if (moved) {
    moved = false
    return
  }

  const heights = snapHeights()
  const expanded = height.value > (minHeight() + maxHeight()) / 2
  snapTo(expanded ? 0 : heights.length - 1)
}

defineExpose({ expand: () => snapTo(props.snapPoints.length - 1), collapse: () => snapTo(0) })
</script>

<template>
  <section
    class="sheet"
    :class="{ 'sheet--dragging': dragging }"
    :style="{ height: height ? `${height}px` : `${(snapPoints[initial] ?? 0.42) * 100}dvh` }"
    role="dialog"
    aria-label="路線選項"
  >
    <!-- 拖曳區：把手 + 標題，內容區留給捲動 -->
    <div class="sheet__grip" @pointerdown="onPointerDown">
      <button
        v-if="handle"
        type="button"
        class="sheet__handle"
        aria-label="展開或收合"
        @click="toggle"
      >
        <span />
      </button>
      <div v-if="$slots.header" class="sheet__header">
        <slot name="header" />
      </div>
    </div>

    <div ref="contentEl" class="sheet__content">
      <slot />
    </div>

    <div v-if="$slots.footer" class="sheet__footer">
      <slot name="footer" />
    </div>
  </section>
</template>

<style scoped>
.sheet {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--screen-w);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -6px 24px rgba(16, 18, 15, 0.14);
  z-index: 30;
  transition: height 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  touch-action: none;
}

/* 拖曳中不要有過場，不然會有延遲感 */
.sheet--dragging {
  transition: none;
}

.sheet__grip {
  flex: none;
  cursor: grab;
  padding-bottom: 4px;
}

.sheet--dragging .sheet__grip {
  cursor: grabbing;
}

.sheet__handle {
  display: block;
  width: 100%;
  padding: 10px 0 6px;
  border: none;
  background: none;
  cursor: pointer;
}

.sheet__handle span {
  display: block;
  width: 46px;
  height: 5px;
  margin: 0 auto;
  border-radius: 999px;
  background: #d3d1c9;
}

.sheet__header {
  padding: 0 16px 8px;
}

.sheet__content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 16px;
  /* 內容自己可以捲，所以這裡要放行手勢 */
  touch-action: pan-y;
}

.sheet__footer {
  flex: none;
  padding: 10px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--bg);
  border-top: 1px solid var(--line);
}
</style>
