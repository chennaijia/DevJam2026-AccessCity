<script setup lang="ts">
const { data: settings } = await useAsyncData('notification-settings', () =>
  api.getNotificationSettings(),
)

/* --- 裝置推播（Web Push）--- */
const { status, busy, isConfigured, refresh, enable } = usePush()
const testResult = ref('')

onMounted(refresh)

const pushText = computed(() => {
  if (!isConfigured.value || status.value === 'unsupported')
    return '這個瀏覽器不支援推播（iPhone 需 iOS 16.4 以上，並先把網站加入主畫面）'
  if (status.value === 'granted') return '已開啟，有緊急狀況時這台裝置會收到通知'
  if (status.value === 'denied') return '通知被封鎖了，請到瀏覽器設定裡重新允許'
  return '開啟後，家人求助或安全檢查未回覆時會立刻通知你'
})

async function enablePush() {
  testResult.value = ''
  await enable()
}

async function sendTest() {
  testResult.value = '傳送中…'
  const result = await api.sendTestPush()
  testResult.value = result.ok ? '已送出，請看通知列' : '沒有可用的裝置，請先開啟通知'
}

const form = reactive(structuredClone(toRaw(settings.value!)))

// TODO: 串接後端 —— PATCH /api/settings/notifications（可加 debounce）
watch(form, () => api.updateNotificationSettings(form), { deep: true })
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="Notifications" back="/caregiver" />

    <h2 class="title-xl">Notification Settings</h2>

    <!-- 裝置推播：沒有這一層的話，提醒只有開著頁面才看得到 -->
    <UiCard :variant="status === 'granted' ? 'active' : 'soft'" padding="14px 16px">
      <div class="row-between">
        <div class="grow">
          <div class="row" style="gap: 8px">
            <AppIcon name="bell" :size="18" />
            <span class="title-md">這台裝置的通知</span>
          </div>
          <p class="muted" style="margin-top: 4px">{{ pushText }}</p>
        </div>
        <UiChip v-if="status === 'granted'" tone="green">已開啟</UiChip>
      </div>

      <div v-if="status !== 'granted'" style="margin-top: 12px">
        <UiButton
          :disabled="busy || status === 'unsupported' || status === 'denied'"
          @click="enablePush"
        >
          {{ busy ? '設定中…' : '開啟通知' }}
        </UiButton>
      </div>

      <div v-else style="margin-top: 12px">
        <UiButton variant="outline" @click="sendTest">發送測試通知</UiButton>
        <p v-if="testResult" class="muted center" style="margin-top: 8px">{{ testResult }}</p>
      </div>
    </UiCard>

    <div class="label">Caregiver</div>
    <ToggleRow
      v-model="form.caregiver.emergencyAlert"
      title="Emergency Alert"
      description="Manual SOS from a family member"
    />
    <ToggleRow
      v-model="form.caregiver.safetyCheckAlert"
      title="Safety Check Alert"
      description="When a member does not respond"
    />
    <ToggleRow
      v-model="form.caregiver.stayDetection"
      title="Stay Detection"
      description="Set per member in Member Detail"
    />
    <ToggleRow
      v-model="form.caregiver.locationNotifications"
      title="Location Notifications"
      description="Arrival and departure updates"
    />

    <div class="label">Person receiving care</div>
    <ToggleRow
      v-model="form.recipient.locationSharing"
      title="Location Sharing"
      description="Shared during trips and alerts"
    />
    <ToggleRow
      v-model="form.recipient.caregiverConnection"
      title="Caregiver Connection"
      description="Allow connected caregiver alerts"
    />
    <ToggleRow
      v-model="form.recipient.safetyCheck"
      title="Safety Check"
      description="Ask if you are okay after long stops"
    />
    <ToggleRow
      v-model="form.recipient.caregiverConnection"
      title="Emergency Contact"
      :description="form.recipient.emergencyContactName"
    />

    <BottomNav />
  </section>
</template>
