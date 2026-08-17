<script setup lang="ts">
/**
 * 被照顧者端的安全層（企劃書 §4.7）
 * Detect → Ask → Wait → Escalate
 *   Detect  停留偵測（正式版由後端 Care Agent 推播，這裡用 demo 按鈕模擬）
 *   Ask     溫和詢問「你還好嗎？」，同時語音播報
 *   Wait    等 WAIT_SECONDS 秒，畫面上顯示倒數
 *   Escalate 逾時未回覆 → 自動升級為 Care Alert 通知照顧者
 */
const props = withDefaults(
  defineProps<{
    /** demo = true 時才顯示「模擬停留」按鈕（導航頁用，避免干擾一般畫面） */
    demo?: boolean
    /** 浮動按鈕距離底部的距離，畫面底部內容較高時要往上讓 */
    bottom?: number
  }>(),
  { demo: false, bottom: 112 },
)

const { speak, stopSpeaking } = useSpeech()

/** 等待回覆的秒數；正式版建議 60–120 秒，demo 用 20 秒比較好演 */
const WAIT_SECONDS = 20

const sosOpen = ref(false)
const checkinOpen = ref(false)
const toast = ref('')
const remaining = ref(WAIT_SECONDS)
let timer: ReturnType<typeof setInterval> | undefined

function showToast(text: string) {
  toast.value = text
  setTimeout(() => (toast.value = ''), 2600)
}

function sendSos() {
  if (import.meta.client) navigator.vibrate?.([100, 50, 100])
  // POST /api/alerts/sos —— 後端會立刻建立 Care Alert 通知照顧者
  sosOpen.value = false
  showToast('已通知照顧者，請待在原地')
  speak('已經通知你的照顧者，請待在原地等一下。', { force: true })
  runInBackground(api.sendSos(), {
    label: 'safety:sos',
    onError: () => showToast('通知傳送失敗，請再試一次'),
  })
}

function openSos() {
  sosOpen.value = true
}

/** Ask：跳出詢問並開始倒數 */
function askCheckin() {
  checkinOpen.value = true
  remaining.value = WAIT_SECONDS
  speak('你好像停了一段時間，還好嗎？', { force: true })
  // 使用者可能沒在看螢幕，震動一下（行動裝置才有效）
  if (import.meta.client) navigator.vibrate?.([200, 100, 200])

  clearInterval(timer)
  timer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) escalate()
  }, 1000)
}

function stopWaiting() {
  clearInterval(timer)
  timer = undefined
  stopSpeaking()
}

/** Escalate：等待逾時仍未回覆 → 升級為 Care Alert */
function escalate() {
  stopWaiting()
  checkinOpen.value = false
  // POST /api/checkin { answer: 'no-response' } —— 後端建立 Care Alert
  showToast('沒有收到回覆，已通知照顧者')
  speak('我沒有收到你的回覆，已經通知你的照顧者。', { force: true })
  runInBackground(api.checkIn('no-response'), {
    label: 'safety:no-response',
    onError: () => showToast('通知傳送失敗，請再試一次'),
  })
}

function answerCheckin(answer: 'ok' | 'need-help') {
  stopWaiting()
  checkinOpen.value = false
  showToast(answer === 'ok' ? '好的，我會繼續陪著你' : '已通知照顧者')
  speak(answer === 'ok' ? '好的，我會繼續陪著你。' : '已經通知你的照顧者了。', { force: true })
  runInBackground(api.checkIn(answer), {
    label: 'safety:check-in',
    onError: () => showToast('狀態同步失敗，請再試一次'),
  })
}

/**
 * TODO: 串接後端 —— 正式版由 Care Agent 偵測長時間未移動後推播，
 *       前端改成監聽推播 / SSE。這裡先用按鈕模擬 demo。
 */
function simulateStop() {
  askCheckin()
}

onBeforeUnmount(stopWaiting)

defineExpose({ openSos, askCheckin })
</script>

<template>
  <div class="overlay" :style="{ bottom: `${props.bottom}px` }">
    <button v-if="demo" class="demo-btn" type="button" @click="simulateStop">
      模擬停留 15 分鐘
    </button>
    <button class="sos" type="button" aria-label="緊急求助 SOS" @click="openSos">SOS</button>

    <ModalDialog
      v-model:open="sosOpen"
      tone="red"
      title="需要緊急協助嗎？"
      message="我會立刻把你的位置和時間傳給照顧者。"
    >
      <UiButton variant="danger" @click="sendSos">送出緊急求助</UiButton>
      <UiButton variant="quiet" @click="sosOpen = false">取消</UiButton>
    </ModalDialog>

    <ModalDialog
      v-model:open="checkinOpen"
      tone="yellow"
      title="你還好嗎？"
      message="你在同一個地方停留超過 15 分鐘了，需要幫忙嗎？"
    >
      <p class="countdown">
        {{ remaining }} 秒內沒有回覆的話，我會幫你通知照顧者
      </p>
      <UiButton variant="green" @click="answerCheckin('ok')">我沒事</UiButton>
      <UiButton variant="danger" @click="answerCheckin('need-help')">我需要幫忙</UiButton>
    </ModalDialog>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--screen-w);
  pointer-events: none;
  z-index: 30;
}

.sos {
  position: absolute;
  right: 16px;
  bottom: 0;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: #12211f;
  color: #fff;
  border: none;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.demo-btn {
  position: absolute;
  left: 16px;
  bottom: 14px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px dashed var(--muted);
  background: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
  pointer-events: auto;
}

.countdown {
  width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--yellow-soft);
  color: #6b4f00;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.toast {
  position: absolute;
  bottom: 84px;
  left: 16px;
  right: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #1c1f1b;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}
</style>
