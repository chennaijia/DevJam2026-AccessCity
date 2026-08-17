<script setup lang="ts">
const { destination, routes, selectedRouteId, selectedRoute, todayNeeds } = usePlanning()
const { user } = useSession()

// 直接進到導航頁（例如重新整理）時，補抓一次路線
if (!routes.value.length) {
  // TODO: 串接後端 —— GET /api/routes?destination=&needs=
  routes.value = await api.getRoutes(
    destination.value || '台大醫院',
    user.value?.needs ?? [],
    todayNeeds.value,
  )
  selectedRouteId.value ||= routes.value.find((r) => r.badge === 'recommended')?.id ?? ''
}

const stepIndex = ref(0)
const muted = ref(false)

const steps = computed(() => selectedRoute.value?.steps ?? [])
const step = computed(() => steps.value[stepIndex.value])

function nextStep() {
  if (stepIndex.value < steps.value.length - 1) stepIndex.value++
  else navigateTo('/map/arrived')
}

/**
 * TODO: 串接語音導航 —— 用 Web Speech API 的 SpeechSynthesis 唸出 step.instruction，
 *       或改由後端回傳語音檔（TTS）。muted 時停止播報。
 */
watch(step, (s) => {
  if (!s || muted.value || !import.meta.client) return
  // speechSynthesis.speak(new SpeechSynthesisUtterance(s.instruction))
})

async function endTrip() {
  // TODO: 串接後端 —— POST /api/trips/:id/end
  await api.endTrip('t_1')
  await navigateTo('/map')
}
</script>

<template>
  <section class="screen screen--flush nav-screen">
    <MapCanvas height="100%" show-route class="nav-screen__bg" :markers="[
      { x: 70, y: 18, label: '', tone: 'teal' },
    ]" />

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
      <MimoBubble text="The path ahead is clear and safe." />

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

    <SafetyOverlay demo />
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
