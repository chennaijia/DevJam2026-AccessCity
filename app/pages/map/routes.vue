<script setup lang="ts">
const { destination, routes, selectedRouteId, selectedRoute, todayNeeds, origin } = usePlanning()
const { user } = useSession()

if (!routes.value.length) {
  // TODO: 串接後端 —— GET /api/routes?destination=&needs=
  routes.value = await api.getRoutes(
    destination.value || '台大醫院',
    user.value?.needs ?? [],
    todayNeeds.value,
    origin.value,
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
  <section class="screen screen--flush routes">
    <div class="routes__header">
      <ScreenHeader title="Accessity" back="/map/plan" />
    </div>

    <MapCanvas
      height="100%"
      class="routes__map"
      show-route
      :route-polyline="selectedRoute?.encodedPolyline"
      :show-construction="routes.some((r) => r.constructionConflicts?.length)"
      :markers="[
        { x: 16, y: 88, label: '', tone: 'teal' },
        { x: 69, y: 20, label: '', tone: 'green' },
      ]"
    >
      <div class="map__chips">
        <UiChip tone="plain"><AppIcon name="pin" :size="15" /> Current Location</UiChip>
        <button class="layers" aria-label="圖層"><AppIcon name="layers" :size="18" /></button>
      </div>
    </MapCanvas>

    <BottomSheet :snap-points="[0.42, 0.9]">
      <template #header>
        <h2 class="title-md">Suggested Routes</h2>
      </template>

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
              :tone="
                r.badge === 'recommended' ? 'green' : r.badge === 'not-recommended' ? 'red' : 'grey'
              "
            >
              {{ r.badgeLabel }}
            </UiChip>
            <span class="title-md">{{ r.durationMinutes }} min</span>
          </div>

          <div
            class="title-md"
            :style="{
              marginTop: '6px',
              color: r.badge === 'recommended' ? 'var(--teal)' : 'inherit',
            }"
          >
            {{ r.title }}
          </div>

          <p v-if="r.warning" class="warn">
            <AppIcon name="warn" :size="15" />
            {{ r.warning }}
          </p>

          <!-- 後端比對出來的施工路段細節 -->
          <div v-if="r.constructionConflicts?.length" class="conflicts">
            <div v-for="c in r.constructionConflicts" :key="c.id">
              {{ c.section }}：{{ c.note }}（至 {{ c.until }}）
            </div>
          </div>

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

      <template #footer>
        <UiButton @click="go">
          <AppIcon name="walk" :size="18" />
          Go with Safety
        </UiButton>
      </template>
    </BottomSheet>
  </section>
</template>

<style scoped>
.routes {
  position: relative;
  height: 100dvh;
  overflow: hidden;
}

.routes__map {
  position: absolute;
  inset: 0;
  border-radius: 0;
}

.routes__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 8px 16px;
  background: linear-gradient(180deg, var(--bg) 55%, rgba(247, 246, 242, 0));
}

.map__chips {
  display: flex;
  justify-content: space-between;
  /* 讓開浮在上面的標題列 */
  padding: 64px 12px 12px;
}

.layers {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--line);
  background: var(--surface);
  cursor: pointer;
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

.conflicts {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ink-soft);
  line-height: 1.5;
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
</style>
