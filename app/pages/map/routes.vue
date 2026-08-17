<script setup lang="ts">
const { destination, routes, selectedRouteId, todayNeeds } = usePlanning()
const { user } = useSession()

if (!routes.value.length) {
  // TODO: 串接後端 —— GET /api/routes?destination=&needs=
  routes.value = await api.getRoutes(
    destination.value || '台大醫院',
    user.value?.needs ?? [],
    todayNeeds.value,
  )
}
selectedRouteId.value ||= routes.value.find((r) => r.badge === 'recommended')?.id ?? ''

async function go() {
  // TODO: 串接後端 —— POST /api/trips { destination, routeId }（開始行程並開始回傳位置）
  await api.startTrip(destination.value, selectedRouteId.value)
  await navigateTo('/map/navigate')
}
</script>

<template>
  <section class="screen screen--flush">
    <div style="padding: 12px 16px 0">
      <ScreenHeader title="Accessity" back="/map/plan" />
    </div>

    <MapCanvas height="270px" show-route class="map" :markers="[
      { x: 16, y: 88, label: '', tone: 'teal' },
      { x: 69, y: 20, label: '', tone: 'green' },
    ]">
      <div class="map__chips">
        <UiChip tone="plain"><AppIcon name="pin" :size="15" /> Current Location</UiChip>
        <button class="layers" aria-label="圖層"><AppIcon name="layers" :size="18" /></button>
      </div>
    </MapCanvas>

    <div class="sheet">
      <div class="sheet__grabber" />
      <h2 class="title-md" style="margin-bottom: 4px">Suggested Routes</h2>

      <div class="stack">
        <UiCard
          v-for="r in routes"
          :key="r.id"
          :variant="selectedRouteId === r.id ? 'active' : 'soft'"
          padding="14px"
          style="cursor: pointer"
          @click="selectedRouteId = r.id"
        >
          <div class="row-between">
            <UiChip
              :tone="r.badge === 'recommended' ? 'green' : r.badge === 'not-recommended' ? 'red' : 'grey'"
            >
              {{ r.badgeLabel }}
            </UiChip>
            <span class="title-md">{{ r.durationMinutes }} min</span>
          </div>

          <div
            class="title-md"
            :style="{ marginTop: '6px', color: r.badge === 'recommended' ? 'var(--teal)' : 'inherit' }"
          >
            {{ r.title }}
          </div>

          <p v-if="r.warning" class="warn">
            <AppIcon name="warn" :size="15" />
            {{ r.warning }}
          </p>

          <div v-if="r.tags.length" class="row" style="flex-wrap: wrap; margin-top: 8px">
            <UiChip v-for="t in r.tags" :key="t" tone="grey">{{ t }}</UiChip>
          </div>

          <div v-if="r.reason" class="reason">
            <p>{{ r.reason }}</p>
            <div class="row" style="gap: 28px; margin-top: 8px">
              <div>
                <div class="muted">Accessibility</div>
                <div class="score">{{ r.accessibilityScore }}%</div>
              </div>
              <div>
                <div class="muted">Safety</div>
                <div class="score">{{ r.safetyScore }}%</div>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <div class="note">It's 4 mins longer, but you can definitely reach this one!</div>
    </div>

    <div class="footer">
      <UiButton @click="go">
        <AppIcon name="walk" :size="18" />
        Go with Safety
      </UiButton>
    </div>
  </section>
</template>

<style scoped>
.map {
  border-radius: 0;
}

.map__chips {
  display: flex;
  justify-content: space-between;
  padding: 12px;
}

.layers {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--line);
  background: var(--surface);
  cursor: pointer;
}

.sheet {
  flex: 1;
  background: var(--bg);
  border-radius: 20px 20px 0 0;
  margin-top: -14px;
  padding: 12px 16px 100px;
  position: relative;
  z-index: 2;
}

.sheet__grabber {
  width: 46px;
  height: 5px;
  border-radius: 999px;
  background: #d3d1c9;
  margin: 0 auto 12px;
}

.warn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--red);
  font-size: 14px;
  font-weight: 700;
  margin-top: 6px;
}

.reason {
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  background: #eef4f2;
  font-size: 14px;
  color: var(--ink-soft);
}

.score {
  font-size: 20px;
  font-weight: 800;
  color: var(--teal);
}

.note {
  margin: 14px 0 0 auto;
  max-width: 220px;
  background: var(--green);
  border: 1px solid var(--line);
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  transform: rotate(-2deg);
}

.footer {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--screen-w);
  padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(247, 246, 242, 0), var(--bg) 30%);
  z-index: 20;
}
</style>
