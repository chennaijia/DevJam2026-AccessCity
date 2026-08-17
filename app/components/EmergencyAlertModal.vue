<script setup lang="ts">
/**
 * 緊急求助彈窗：照顧者不管在哪一頁都會看到，並持續震動／發出提示音，
 * 直到按下「我正在前往」或「稍後處理」。
 */
const { current, start, stop, acknowledge, snooze } = useEmergencyAlert()

onMounted(start)
onBeforeUnmount(stop)

const responding = ref(false)

async function respondNow() {
  responding.value = true
  try {
    await acknowledge('responding')
  } finally {
    responding.value = false
  }
}

async function openDetail() {
  const id = current.value?.id
  await acknowledge('received')
  if (id) await navigateTo(`/caregiver/alerts/${id}`)
}

function call() {
  // TODO: 換成成員設定裡的緊急聯絡電話
  navigateTo('tel:0000000000', { external: true })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="current" class="emergency" role="alertdialog" aria-modal="true">
      <div class="emergency__panel">
        <span class="emergency__pulse" aria-hidden="true">
          <AppIcon name="warn" :size="34" />
        </span>

        <h2 class="emergency__title">緊急求助</h2>
        <p class="emergency__name">{{ current.memberName }} 需要立即協助</p>

        <div class="emergency__facts">
          <div class="emergency__fact">
            <span class="muted">位置</span>
            <b>{{ current.location }}</b>
          </div>
          <div class="emergency__fact">
            <span class="muted">時間</span>
            <b>{{ current.time }}</b>
          </div>
          <div class="emergency__fact">
            <span class="muted">最後移動</span>
            <b>{{ current.lastMovement }}</b>
          </div>
        </div>

        <div class="emergency__actions">
          <UiButton variant="danger" :disabled="responding" @click="call">
            <AppIcon name="shield" :size="18" />
            立即撥打電話
          </UiButton>
          <UiButton variant="green" :disabled="responding" @click="respondNow">
            {{ responding ? '回覆中…' : '我正在前往' }}
          </UiButton>
          <UiButton variant="ghost" :disabled="responding" @click="openDetail">
            查看位置與細節
          </UiButton>
          <UiButton variant="quiet" :disabled="responding" @click="snooze">稍後處理</UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.emergency {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(70, 12, 8, 0.55);
  backdrop-filter: blur(2px);
  animation: flash 1.6s ease-in-out infinite;
}

/* 背景輕微明暗變化，餘光也看得到 */
@keyframes flash {
  50% {
    background: rgba(120, 20, 14, 0.62);
  }
}

.emergency__panel {
  width: 100%;
  max-width: 340px;
  background: var(--surface);
  border: 2px solid var(--red);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
  padding: 24px 20px 20px;
  text-align: center;
}

.emergency__pulse {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: var(--red);
  color: #fff;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(214, 79, 69, 0.5);
  }
  70% {
    box-shadow: 0 0 0 16px rgba(214, 79, 69, 0);
  }
}

.emergency__title {
  font-size: 24px;
  font-weight: 800;
  color: var(--red);
}

.emergency__name {
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
}

.emergency__facts {
  margin: 16px 0 18px;
  padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--surface-sunken);
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  font-size: 14px;
}

.emergency__fact {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.emergency__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .emergency,
  .emergency__pulse {
    animation: none;
  }
}
</style>
