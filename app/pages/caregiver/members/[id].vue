<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

// TODO: 串接後端 —— GET /api/members/:id（位置、電量、最後移動時間）
const { data: member } = await useAsyncData(`member-${id}`, () => api.getMember(id))
// TODO: 串接後端 —— GET /api/trips/current（這位成員進行中的行程與事件時間軸）
const { data: trip } = await useAsyncData(`member-trip-${id}`, () => api.getCurrentTrip())

const stayOptions = [5, 10, 15, 30]
const stayMinutes = ref(member.value?.stayAlertMinutes ?? 15)
const notifications = reactive({
  safetyCheck: member.value?.notifications.safetyCheck ?? true,
  location: member.value?.notifications.location ?? true,
  emergency: member.value?.notifications.emergency ?? true,
})

// TODO: 串接後端 —— PATCH /api/members/:id（停留提醒門檻與通知開關）
watch([stayMinutes, notifications], () => {
  api.updateMemberSettings(id, {
    stayAlertMinutes: stayMinutes.value,
    notifications: { ...notifications },
  })
}, { deep: true })

function call() {
  // TODO: 正式版改成 tel: 連結或 VoIP；此處先留接口
  navigateTo(`tel:0000000000`, { external: true })
}
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader :title="member?.name" back="/caregiver" />

    <MapCanvas height="150px" show-flood :markers="[{ x: 50, y: 50, label: '', tone: 'teal' }]">
      <div style="padding: 10px">
        <UiChip :tone="member?.status === 'safe' ? 'green' : 'yellow'">
          {{ member?.statusLabel }}
        </UiChip>
      </div>
    </MapCanvas>

    <InfoCard label="Current location" :value="member?.lastLocation ?? '—'" />
    <InfoCard label="Last movement" :value="member?.lastActivityAt ?? '—'" />
    <InfoCard label="Battery" :value="`${member?.batteryPercent ?? 0}%`" />

    <UiCard variant="soft" padding="14px 16px">
      <div class="row" style="gap: 8px; color: var(--teal)">
        <AppIcon name="history" :size="18" /><span class="title-md">Trip Timeline</span>
      </div>
      <ul class="timeline">
        <li v-for="e in trip?.events" :key="e.id">
          <b>{{ e.time }}</b> — {{ e.title }}
          <div class="muted">{{ e.detail }}</div>
        </li>
      </ul>
    </UiCard>

    <div class="label">Notify me if {{ member?.name }} stays in the same area for</div>
    <div class="row" style="flex-wrap: wrap">
      <UiChip
        v-for="opt in stayOptions"
        :key="opt"
        as="button"
        :selected="stayMinutes === opt"
        @click="stayMinutes = opt"
      >
        {{ opt }} min
      </UiChip>
      <UiChip as="button">Custom</UiChip>
    </div>

    <div class="label">Notifications for this member</div>
    <ToggleRow v-model="notifications.safetyCheck" title="Safety check alerts" />
    <ToggleRow v-model="notifications.location" title="Location notifications" />
    <ToggleRow v-model="notifications.emergency" title="Emergency alerts" />

    <div class="row">
      <UiButton @click="call">Call</UiButton>
      <UiButton variant="outline">Message</UiButton>
    </div>

    <BottomNav />
  </section>
</template>

<style scoped>
.timeline {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}
</style>
