<script setup lang="ts">
/**
 * App 在前景時收到的推播：系統通知不會跳，所以自己顯示一條橫幅。
 * 放在 default layout，所有頁面都看得到。
 */
const { foreground } = usePush()

watch(foreground, (message) => {
  // 緊急求助交給 EmergencyAlertModal，這裡不重複顯示
  if (!message || message.kind === 'emergency') return
  setTimeout(() => (foreground.value = null), 8000)
})

async function open() {
  const url = foreground.value?.url
  foreground.value = null
  if (url) await navigateTo(url)
}
</script>

<template>
  <Transition name="drop">
    <div v-if="foreground" class="toast" role="status">
      <button type="button" class="toast__body" @click="open">
        <AppIcon name="warn" :size="20" />
        <span class="grow">
          <b>{{ foreground.title }}</b>
          <span class="toast__text">{{ foreground.body }}</span>
        </span>
      </button>
      <button type="button" class="toast__close" aria-label="關閉" @click="foreground = null">
        ✕
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 24px);
  max-width: calc(var(--screen-w) - 24px);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 12px 12px 14px;
  border-radius: var(--radius);
  background: var(--yellow);
  color: #3a2c00;
  box-shadow: var(--shadow-lift);
  z-index: 80;
}

.toast__body {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  border: none;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.toast__text {
  display: block;
  font-size: 13px;
  opacity: 0.85;
}

.toast__close {
  border: none;
  background: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 6px;
}

.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}
</style>
