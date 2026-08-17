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
    <ScreenHeader title="通知" back="/caregiver" />

    <h2 class="title-xl">通知設定</h2>

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

    <div class="label">照顧者</div>
    <ToggleRow
      v-model="form.caregiver.emergencyAlert"
      title="緊急求助提醒"
      description="家人按下 SOS 時立刻通知"
    />
    <ToggleRow
      v-model="form.caregiver.safetyCheckAlert"
      title="安全確認提醒"
      description="家人沒有回覆確認時通知"
    />
    <ToggleRow
      v-model="form.caregiver.stayDetection"
      title="停留偵測"
      description="每位家人的時間可在成員頁個別設定"
    />
    <ToggleRow
      v-model="form.caregiver.locationNotifications"
      title="位置通知"
      description="出發與抵達時通知"
    />

    <div class="label">被照顧者</div>
    <ToggleRow
      v-model="form.recipient.locationSharing"
      title="位置分享"
      description="行程進行中與發出提醒時分享位置"
    />
    <ToggleRow
      v-model="form.recipient.caregiverConnection"
      title="照顧者連結"
      description="允許已連結的照顧者收到提醒"
    />
    <ToggleRow
      v-model="form.recipient.safetyCheck"
      title="安全確認"
      description="長時間停留時主動問你還好嗎"
    />
    <ToggleRow
      v-model="form.recipient.caregiverConnection"
      title="緊急聯絡人"
      :description="form.recipient.emergencyContactName"
    />

    <BottomNav />
  </section>
</template>
