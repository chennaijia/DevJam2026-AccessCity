<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

// 成員資料與這位成員的行程一起取；沒有進行中的行程時後端回 404，不能讓整頁掛掉
const { data: detail } = await useAsyncData(`member-${id}`, async () => {
  const [member, trip] = await Promise.all([
    api.getMember(id),
    api.getCurrentTrip().catch(() => null),
  ])
  return { member, trip }
})

const member = computed(() => detail.value?.member ?? null)
const trip = computed(() => detail.value?.trip ?? null)

const stayOptions = [5, 10, 15, 30]
const stayMinutes = ref(member.value?.stayAlertMinutes ?? 15)
const notifications = reactive({
  safetyCheck: member.value?.notifications.safetyCheck ?? true,
  location: member.value?.notifications.location ?? true,
  emergency: member.value?.notifications.emergency ?? true,
})

const saved = ref(false)
let savedTimer: ReturnType<typeof setTimeout> | undefined
let syncTimer: ReturnType<typeof setTimeout> | undefined

// PATCH /api/members/:id（停留提醒門檻與通知開關）—— 自動儲存並給使用者回饋
watch(
  [stayMinutes, notifications],
  () => {
    saved.value = true
    clearTimeout(savedTimer)
    savedTimer = setTimeout(() => (saved.value = false), 1800)
    clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      runInBackground(
        api.updateMemberSettings(id, {
          stayAlertMinutes: stayMinutes.value,
          notifications: { ...notifications },
        }),
        { label: 'member-settings:update' },
      )
    }, 300)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  clearTimeout(savedTimer)
  clearTimeout(syncTimer)
})

const { pending, load: loadAlerts } = useAlerts()
await loadAlerts()
const memberAlerts = computed(() => pending.value.filter((a) => a.memberId === id))

const removing = ref(false)

/** 把成員移出家庭：對方的帳號也會脫離，之後看不到彼此 */
async function removeMember() {
  if (!confirm(`確定要把 ${member.value?.name} 移出家庭嗎？`)) return
  removing.value = true
  try {
    await api.removeMember(id)
    await navigateTo('/caregiver')
  } finally {
    removing.value = false
  }
}

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

    <InfoCard label="目前位置" :value="member?.lastLocation ?? '—'" />
    <InfoCard label="最後移動" :value="member?.lastActivityAt ?? '—'" />
    <InfoCard label="手機電量" :value="`${member?.batteryPercent ?? 0}%`" />

    <UiCard variant="soft" padding="14px 16px">
      <div class="row" style="gap: 8px; color: var(--teal)">
        <AppIcon name="history" :size="18" /><span class="title-md">行程時間軸</span>
      </div>
      <ul v-if="trip?.events?.length" class="timeline">
        <li v-for="e in trip.events" :key="e.id">
          <b>{{ e.time }}</b> — {{ e.title }}
          <div class="muted">{{ e.detail }}</div>
        </li>
      </ul>
      <p v-else class="muted" style="margin-top: 8px">目前沒有進行中的行程</p>
    </UiCard>

    <!-- 這位成員未處理的提醒，直接從詳情頁進去處理 -->
    <UiCard
      v-for="a in memberAlerts"
      :key="a.id"
      :variant="a.kind === 'emergency' ? 'danger' : 'soft'"
      padding="12px 16px"
      :to="`/caregiver/alerts/${a.id}`"
    >
      <div class="row-between">
        <div class="row" style="gap: 8px">
          <AppIcon name="warn" :size="18" />
          <div>
            <div class="title-md">{{ a.title }}</div>
            <div class="muted">{{ a.time }}</div>
          </div>
        </div>
        <span style="font-size: 22px; color: var(--ink-soft)">›</span>
      </div>
    </UiCard>

    <div class="row-between">
      <span class="label">{{ member?.name }} 在同一個地方停留多久要通知我</span>
      <span v-if="saved" class="saved">已儲存</span>
    </div>
    <div class="row" style="flex-wrap: wrap">
      <UiChip
        v-for="opt in stayOptions"
        :key="opt"
        as="button"
        :selected="stayMinutes === opt"
        @click="stayMinutes = opt"
      >
        {{ opt }} 分鐘
      </UiChip>
      <UiChip as="button">自訂</UiChip>
    </div>

    <div class="label">這位家人的通知</div>
    <ToggleRow v-model="notifications.safetyCheck" title="安全確認提醒" />
    <ToggleRow v-model="notifications.location" title="位置通知" />
    <ToggleRow v-model="notifications.emergency" title="緊急求助提醒" />

    <div class="row">
      <UiButton @click="call">撥打電話</UiButton>
      <UiButton variant="outline">傳訊息</UiButton>
    </div>

    <UiButton variant="quiet" :disabled="removing" @click="removeMember">
      {{ removing ? '移除中…' : '將此成員移出家庭' }}
    </UiButton>

    <BottomNav />
  </section>
</template>

<style scoped>
.saved {
  font-size: 12px;
  font-weight: 700;
  color: var(--green-strong);
}

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
