<script setup lang="ts">
const { destination, routes, selectedRouteId, selectedRoute, todayNeeds, origin } = usePlanning()
const { user } = useSession()

// 直接進到導航頁（例如重新整理）時，補抓一次路線
if (!routes.value.length) {
  // TODO: 串接後端 —— GET /api/routes?destination=&needs=
  routes.value = await api.getRoutes(
    destination.value || '台大醫院',
    user.value?.needs ?? [],
    todayNeeds.value,
    origin.value,
  )
  selectedRouteId.value ||= routes.value.find((r) => r.badge === 'recommended')?.id ?? ''
}

const { speak, replay, stopSpeaking, canSpeak } = useSpeech()

const stepIndex = ref(0)
const muted = ref(false)

const steps = computed(() => selectedRoute.value?.steps ?? [])
const step = computed(() => steps.value[stepIndex.value])

/** 目前這條路線撞到的施工路段（Navigation Agent 已在後端比對過） */
const conflicts = computed(() => selectedRoute.value?.constructionConflicts ?? [])

function nextStep() {
  if (stepIndex.value < steps.value.length - 1) stepIndex.value++
  else navigateTo('/map/arrived')
}

/** Voice-first：每個路口指示都自動播報，靜音時不出聲 */
watch(
  step,
  (s) => {
    if (!s || muted.value) return
    speak(s.instruction)
  },
  { immediate: true },
)

watch(muted, (isMuted) => {
  if (isMuted) stopSpeaking()
})

/** 開始導航時先講一次總覽（企劃書 Scene 2 的語音回覆） */
onMounted(() => {
  if (muted.value) return
  const total = selectedRoute.value?.durationMinutes
  const avoided = conflicts.value.length
    ? '路上有施工，我已經幫你改走替代道路。'
    : '這條路線目前沒有施工影響。'
  speak(`已找到路線，約 ${total} 分鐘。${avoided}`, { force: true })
})

onBeforeUnmount(() => stopSpeaking())

/** Help：直接叫出求助對話框（企劃書導航畫面的 Help Button） */
const safety = ref<{ openSos: () => void } | null>(null)
function askForHelp() {
  speak('需要幫忙嗎？我可以幫你通知照顧者。', { force: true })
  safety.value?.openSos()
}

async function endTrip() {
  // TODO: 串接後端 —— POST /api/trips/:id/end
  await api.endTrip('t_1')
  await navigateTo('/map')
}
</script>

<template>
  <section class="screen screen--flush nav-screen">
    <MapCanvas
      height="100%"
      show-route
      :route-polyline="selectedRoute?.encodedPolyline"
      :show-construction="!!conflicts.length"
      class="nav-screen__bg"
      :markers="[{ x: 70, y: 18, label: '', tone: 'teal' }]"
    />

    <div class="nav-screen__top">
      <div class="instruction" @click="nextStep">
        <span class="instruction__icon" aria-hidden="true">↱</span>
        <div class="grow">
          <div class="instruction__text">{{ step?.instruction ?? '準備出發' }}</div>
          <div class="instruction__sub">前往 {{ destination || '目的地' }}</div>
        </div>
        <UiChip v-if="step?.tag" tone="plain">{{ step.tag }}</UiChip>
      </div>
    </div>

    <div class="nav-screen__bottom">
      <!-- 施工提示：後端比對出來的路段直接講清楚 -->
      <UiCard
        v-if="conflicts.length"
        variant="danger"
        padding="10px 14px"
        style="margin-bottom: 10px"
      >
        <div class="row" style="gap: 8px">
          <AppIcon name="warn" :size="18" />
          <div style="font-size: 14px; font-weight: 700">
            {{ conflicts.map((c) => c.section).join('、') }} 施工至 {{ conflicts[0]?.until }}
          </div>
        </div>
      </UiCard>

      <MimoBubble
        :text="
          conflicts.length ? '前面有施工，我已經幫你避開了。' : 'The path ahead is clear and safe.'
        "
      />

      <!-- 語音優先：大按鈕的重聽與求助 -->
      <div class="row" style="margin-top: 12px">
        <UiButton variant="outline" pill :disabled="!canSpeak()" @click="replay">
          <AppIcon name="sound" :size="17" />
          再聽一次
        </UiButton>
        <UiButton variant="green" pill @click="askForHelp">
          <AppIcon name="info" :size="17" />
          需要協助
        </UiButton>
      </div>

      <div class="row" style="margin-top: 12px">
        <UiButton variant="ghost" pill @click="navigateTo('/report')">
          <AppIcon name="warn" :size="17" />
          Report Issue
        </UiButton>
        <UiButton variant="ghost" pill :block="false" aria-label="語音開關" @click="muted = !muted">
          <AppIcon :name="muted ? 'mute' : 'sound'" :size="18" />
        </UiButton>
        <UiButton variant="danger" pill @click="endTrip">
          <AppIcon name="close" :size="17" />
          End Trip
        </UiButton>
      </div>
    </div>

    <SafetyOverlay ref="safety" demo :bottom="conflicts.length ? 300 : 250" />
  </section>
</template>

<style scoped>
.nav-screen {
  position: relative;
  min-height: 100dvh;
}

.nav-screen__bg {
  position: absolute;
  inset: 0;
  border-radius: 0;
}

.nav-screen__top {
  position: relative;
  padding: 14px 14px 0;
}

.instruction {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--green-strong);
  color: #fff;
  box-shadow: var(--shadow-lift);
  cursor: pointer;
}

.instruction__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  font-size: 20px;
}

.instruction__text {
  font-size: 19px;
  font-weight: 800;
  line-height: 1.2;
}

.instruction__sub {
  font-size: 13px;
  opacity: 0.85;
}

.nav-screen__bottom {
  position: relative;
  margin-top: auto;
  padding: 16px 14px calc(18px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(247, 246, 242, 0), var(--bg) 26%);
}
</style>
