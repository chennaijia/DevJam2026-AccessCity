<script setup lang="ts">
/** 照顧者主頁：即時位置、本週統計、最近活動 */
// TODO: 串接後端 —— GET /api/trips/overview、GET /api/members、GET /api/alerts
const { data: overview } = await useAsyncData('cg-overview', () => api.getWeeklyOverview())
const { data: members } = await useAsyncData('cg-members', () => api.getMembers())
const { data: alerts } = await useAsyncData('cg-alerts', () => api.getAlerts())

const monitored = computed(() => members.value?.[0])

/**
 * 停留提醒：只有 Care Agent 判定「停太久」時才會出現在主頁頂端。
 * TODO: 串接後端 —— 正式版改由推播 / SSE 觸發，這裡讀 /api/alerts 的 stationary 事件。
 */
const stationaryAlert = computed(() =>
  alerts.value?.find((a) => a.kind === 'stationary' && !a.acknowledged),
)
</script>

<template>
  <section class="screen screen--flush screen--nav">
    <AlertBanner
      v-if="stationaryAlert"
      tone="yellow"
      title="Stationary Alert"
      :message="stationaryAlert.message"
    >
      <template #action>
        <UiButton variant="dark" :block="false" to="/caregiver/alerts/safety">Contact</UiButton>
      </template>
    </AlertBanner>

    <div class="body-pad">
      <div class="row-between">
        <div>
          <div class="title-md">Caregiver Dashboard</div>
          <div class="row" style="gap: 6px">
            <span style="color: var(--green-strong); display: flex">
              <AppIcon name="activity" :size="18" />
            </span>
            <span class="muted">Currently Monitoring: <b>{{ monitored?.name }}</b></span>
          </div>
        </div>
        <span class="mimo-avatar"><MimoMascot :size="46" /></span>
      </div>

      <UiCard variant="soft" padding="0" style="overflow: hidden">
        <div class="loc-head">
          <span class="title-md">{{ monitored?.name }}'s Location</span>
          <span class="muted">Updated 2 mins ago</span>
        </div>

        <MapCanvas
          height="230px"
          show-route
          :markers="[
            { x: 32, y: 44, label: '', tone: 'teal' },
            { x: 14, y: 82, label: '', tone: 'green' },
          ]"
          style="border-radius: 0"
        >
          <div class="loc-search">
            <AppIcon name="search" :size="13" />
            <span>Search location</span>
          </div>

          <div class="loc-callout">
            <AppIcon name="house" :size="14" />
            <div>
              <b>Main St</b>
              <div class="muted" style="font-size: 11px">Drop-off Point</div>
            </div>
          </div>

          <div class="loc-start">Start: 14 Maple Ave</div>
        </MapCanvas>
      </UiCard>

      <UiCard variant="soft" padding="14px 16px">
        <div class="row" style="gap: 8px; color: var(--teal)">
          <AppIcon name="chart" :size="18" /><span class="title-md">Weekly Overview</span>
        </div>
        <div class="row" style="gap: 12px; margin-top: 10px">
          <div class="stat">
            <div class="stat__num">{{ overview?.kmTracked }}</div>
            <div class="muted">km Tracked</div>
          </div>
          <div class="stat">
            <div class="stat__num" style="color: var(--green-strong)">
              {{ overview?.safeArrivals }}
            </div>
            <div class="muted">Safe Arrivals</div>
          </div>
        </div>
      </UiCard>

      <UiCard variant="soft" padding="14px 16px">
        <div class="row" style="gap: 8px; color: var(--teal)">
          <AppIcon name="history" :size="18" /><span class="title-md">Recent Activity</span>
        </div>
        <div class="activity">
          <div v-for="a in overview?.recentActivity" :key="a.id" class="row activity__row">
            <span class="bullet" :class="`bullet--${a.kind}`">
              <AppIcon :name="a.kind === 'arrival' ? 'check' : 'walk'" :size="18" />
            </span>
            <div>
              <div class="title-md">{{ a.title }}</div>
              <div class="muted">{{ a.detail }}</div>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <BottomNav />
  </section>
</template>

<style scoped>
.body-pad {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 16px 100px;
}

.mimo-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  display: grid;
  place-items: center;
}

/* --- 位置卡 --- */
.loc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  background: var(--surface-sunken);
}

.loc-search {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  font-size: 11px;
  box-shadow: var(--shadow-card);
}

.loc-callout {
  position: absolute;
  top: 38%;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-soft);
  font-size: 13px;
  color: var(--teal);
}

.loc-start {
  position: absolute;
  left: 21%;
  bottom: 12%;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  font-weight: 600;
}

/* --- 統計 --- */
.stat {
  flex: 1;
  background: var(--surface-sunken);
  border-radius: 12px;
  padding: 16px 14px;
  text-align: center;
}

.stat__num {
  font-size: 28px;
  font-weight: 800;
  color: var(--teal);
}

/* --- 最近活動 --- */
.activity {
  margin-top: 6px;
}

.activity__row {
  padding: 12px 0;
}

.activity__row + .activity__row {
  border-top: 1px solid var(--line);
}

.bullet {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--green);
  color: #0d3a16;
  display: grid;
  place-items: center;
}

.bullet--arrival {
  background: var(--teal);
  color: #fff;
}
</style>
