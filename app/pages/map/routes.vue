<script setup lang="ts">
const {
  destination,
  routes,
  selectedRouteId,
  selectedRoute,
  todayNeeds,
  chipNeeds,
  ignoreProfileNeeds,
  origin,
  originPlace,
  showConstructionIcons,
  runPlanning,
  planTrace,
} = usePlanning()
const { user } = useSession()
const testQuery = useRoute().query

/**
 * 測試用：網址可以直接帶 destLat/destLng（+ originLat/originLng、needs、today）
 * 蓋掉正常流程解析出來的目的地/需求，方便重現特定測試案例，不用透過 Mimo 對話走一輪。
 * 例：/map/routes?destLat=25.0197&destLng=121.5580&originLat=25.0161&originLng=121.5576&needs=avoid-construction
 */
const testDestLat = Number(testQuery.destLat)
const testDestLng = Number(testQuery.destLng)
const hasTestDest = Number.isFinite(testDestLat) && Number.isFinite(testDestLng)

const testOriginLat = Number(testQuery.originLat)
const testOriginLng = Number(testQuery.originLng)
const hasTestOrigin = Number.isFinite(testOriginLat) && Number.isFinite(testOriginLng)

// 直接開這頁（重新整理或測試網址）時補算一次；走 runPlanning 才會一併收到規劃過程
if (!routes.value.length) {
  await runPlanning({
    destination: (testQuery.destination as string) || destination.value || '台大醫院',
    needs: testQuery.needs
      ? (String(testQuery.needs).split(',') as AccessNeed[])
      : ignoreProfileNeeds.value
        ? []
        : (user.value?.needs ?? []),
    origin: hasTestOrigin ? { lat: testOriginLat, lng: testOriginLng } : origin.value,
    destCoords: hasTestDest ? { lat: testDestLat, lng: testDestLng } : null,
    originText: (testQuery.origin as string) || originPlace.value || undefined,
    todayOverride: testQuery.today ? String(testQuery.today).split(',') : undefined,
  })
}
selectedRouteId.value ||= routes.value.find((r) => r.badge === 'recommended')?.id ?? ''

/** Google 原本給的第一條路線，沒套用任何無障礙／施工考量，拿來跟目前選的路線做視覺比較 */
const baselineRoute = computed(
  () => routes.value.find((r) => !r.id.includes('-detour')) ?? routes.value[0],
)
const showComparison = computed(
  () => !!baselineRoute.value && baselineRoute.value.id !== selectedRoute.value?.id,
)
/** 選的路線比原始路線多花幾分鐘；沒有比較對象或沒比較慢就不顯示那張便條 */
const extraMinutes = computed(() => {
  if (!showComparison.value || !selectedRoute.value || !baselineRoute.value) return 0
  return Math.max(0, selectedRoute.value.durationMinutes - baselineRoute.value.durationMinutes)
})

// 勾 Safety 才在地圖上標施工地點；勾 Wheelchair 才標無障礙通行點——沒勾就不顯示，維持原本畫面乾淨
const showSafetyMarkers = computed(
  () => todayNeeds.value.includes('avoid-construction') && showConstructionIcons.value,
)
const showWheelchairMarkers = computed(() => todayNeeds.value.includes('wheelchair'))
const constructionMarkers = computed(() =>
  showSafetyMarkers.value ? toConstructionMarkers(selectedRoute.value?.constructionConflicts) : [],
)
/** 開關上顯示的施工數量；沒勾 Safety 就沒比對過，顯示 0 會誤導成「沿途沒施工」 */
const constructionCount = computed(() =>
  todayNeeds.value.includes('avoid-construction')
    ? toConstructionMarkers(selectedRoute.value?.constructionConflicts).length
    : null,
)
const facilityMarkers = computed(() =>
  showWheelchairMarkers.value
    ? (selectedRoute.value?.accessibilityFacilities ?? []).map((f) => ({
        lat: f.lat,
        lng: f.lng,
        label: f.name,
      }))
    : [],
)

async function go() {
  // TODO: 串接後端 —— POST /api/trips { destination, routeId }（開始行程並開始回傳位置）
  await api.startTrip(destination.value, selectedRouteId.value)
  await navigateTo('/map/navigate')
}
</script>

<template>
  <section class="screen screen--flush routes">
    <div class="routes__header">
      <ScreenHeader title="AccessCity" back="/map/plan" />
    </div>

    <MapCanvas
      height="100%"
      class="routes__map"
      show-route
      :route-polyline="selectedRoute?.encodedPolyline"
      :compare-polyline="showComparison ? baselineRoute?.encodedPolyline : undefined"
      :show-construction="showSafetyMarkers"
      :construction-markers="constructionMarkers"
      :facility-markers="facilityMarkers"
    >
      <div class="map__chips">
        <UiChip tone="plain"><AppIcon name="pin" :size="15" /> 目前位置</UiChip>
        <div class="row" style="gap: 8px">
          <!-- 施工圖標開關：只是把地圖上的吉祥物收起來，路線本身仍然有避開施工 -->
          <!-- <UiChip
            as="button"
            :tone="showConstructionIcons ? 'green' : 'grey'"
            :aria-pressed="showConstructionIcons"
            :title="
              showConstructionIcons ? '隱藏地圖上的施工圖標' : '顯示地圖上的施工圖標'
            "
            @click="showConstructionIcons = !showConstructionIcons"
          >
            🚧 施工圖標
            <span class="chip-state">{{ showConstructionIcons ? '開' : '關' }}</span>
            <span v-if="constructionCount" class="chip-count">{{ constructionCount }}</span>
          </UiChip> -->
          <button class="layers" aria-label="圖層"><AppIcon name="layers" :size="18" /></button>
        </div>
      </div>
      <div v-if="showComparison" class="map__legend">
        <span class="map__legend-item"
          ><i class="map__legend-line map__legend-line--solid" />目前選擇的路線</span
        >
        <span class="map__legend-item"
          ><i class="map__legend-line map__legend-line--dashed" />原始 Google
          路線（未套用考量）</span
        >
      </div>
    </MapCanvas>

    <BottomSheet :snap-points="[0.42, 0.9]">
      <template #header>
        <h2 class="title-md">建議路線</h2>
      </template>

      <PlanTraceCard :trace="planTrace" style="margin-bottom: 12px" />

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
            <span class="title-md">{{ r.durationMinutes }} 分鐘</span>
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
              <div v-if="r.accessibilityScore != null">
                <div class="muted">無障礙程度</div>
                <div class="score">{{ r.accessibilityScore }}%</div>
              </div>
              <div v-if="r.safetyScore != null">
                <div class="muted">安全程度</div>
                <div class="score">{{ r.safetyScore }}%</div>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <div v-if="extraMinutes" class="note">多花 {{ extraMinutes }} 分鐘，但這條你一定到得了！</div>

      <template #footer>
        <UiButton @click="go">
          <AppIcon name="walk" :size="18" />
          就走這條
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

.map__legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-card);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-soft);
}

.map__legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.map__legend-line {
  display: inline-block;
  width: 18px;
  height: 0;
  border-top: 3px solid;
}

.map__legend-line--solid {
  border-color: #0b5f5c;
}

.map__legend-line--dashed {
  border-color: #9a978d;
  border-top-style: dashed;
}

.chip-state {
  font-size: 12px;
  opacity: 0.75;
}

.chip-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--red-soft);
  color: var(--red);
  font-size: 11px;
  font-weight: 800;
  text-align: center;
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
