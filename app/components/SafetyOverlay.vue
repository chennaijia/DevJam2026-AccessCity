<script setup lang="ts">
/**
 * 被照顧者端的安全層：SOS 按鈕 + 緊急確認 + 停留 Check-in 詢問。
 * Detect → Ask → Wait → Escalate（企劃書 §4.7）
 */
const sosOpen = ref(false)
const checkinOpen = ref(false)
const toast = ref('')

function showToast(text: string) {
  toast.value = text
  setTimeout(() => (toast.value = ''), 2200)
}

async function sendSos() {
  // TODO: 串接後端 —— POST /api/alerts/sos（帶目前座標），後端立刻推播給照顧者
  await api.sendSos()
  sosOpen.value = false
  showToast('已通知照顧者，請待在原地')
}

async function answerCheckin(answer: 'ok' | 'need-help') {
  // TODO: 串接後端 —— POST /api/checkin { answer }
  //       'ok' → 不打擾照顧者；'need-help' → 立即升級為 Care Alert
  await api.checkIn(answer)
  checkinOpen.value = false
  showToast(answer === 'ok' ? '好的，我會繼續陪著你' : '已通知照顧者')
}

/**
 * TODO: 串接後端 —— 正式版由後端 Care Agent 偵測長時間未移動後推播，
 *       前端改成監聽推播 / SSE。這裡先用按鈕模擬 demo。
 */
function simulateStop() {
  checkinOpen.value = true
}
</script>

<template>
  <div class="overlay">
    <button class="demo-btn" type="button" @click="simulateStop">模擬停留 15 分鐘</button>
    <button class="sos" type="button" aria-label="緊急求助 SOS" @click="sosOpen = true">SOS</button>

    <ModalDialog
      v-model:open="sosOpen"
      tone="red"
      title="Do you need emergency assistance?"
      message="Your caregiver will be notified immediately with your location and the current time."
    >
      <UiButton variant="danger" @click="sendSos">Send Emergency Alert</UiButton>
      <UiButton variant="quiet" @click="sosOpen = false">Cancel</UiButton>
    </ModalDialog>

    <ModalDialog
      v-model:open="checkinOpen"
      tone="yellow"
      title="Are you okay?"
      message="We noticed that you have stayed in the same location for more than 15 minutes. Do you need help?"
    >
      <UiButton variant="green" @click="answerCheckin('ok')">I'm OK</UiButton>
      <UiButton variant="danger" @click="answerCheckin('need-help')">I Need Help</UiButton>
    </ModalDialog>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  bottom: 190px;
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
