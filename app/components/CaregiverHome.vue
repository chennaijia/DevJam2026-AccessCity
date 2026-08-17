<script setup lang="ts">
/** 照顧者主頁：需要注意的事 → 正在關注的人 → 即時位置 → 本週統計 → 最近活動 */
const { members, selected, selectedId, load, select } = useCaregiver()
const { pending, load: loadAlerts } = useAlerts()

await load()
await loadAlerts()

// TODO: 串接後端 —— GET /api/trips/overview（正式版改成帶 memberId 取個別統計）
const { data: overview } = await useAsyncData('cg-overview', () => api.getWeeklyOverview())
</script>

<template>
  <section class="screen screen--flush screen--nav">
    <div class="body-pad">
      <div class="row-between">
        <div>
          <div class="title-md">Caregiver Dashboard</div>
          <div class="row" style="gap: 6px">
            <span style="color: var(--green-strong); display: flex">
              <AppIcon name="activity" :size="18" />
            </span>
            <span class="muted">Currently Monitoring: <b>{{ selected?.name }}</b></span>
          </div>
        </div>
        <span class="mimo-avatar"><MimoMascot :size="46" /></span>
      </div>

      <!-- 需要注意：未處理的提醒集中在最上面，不再只靠條件式橫幅 -->
      <template v-if="pending.length">
        <div class="row-between">
          <span class="label">需要注意（{{ pending.length }}）</span>
          <NuxtLink to="/caregiver/alerts" class="more">全部提醒</NuxtLink>
        </div>
        <UiCard
          v-for="a in pending.slice(0, 2)"
          :key="a.id"
          :variant="a.kind === 'emergency' ? 'danger' : 'soft'"
          padding="14px 16px"
          :to="`/caregiver/alerts/${a.id}`"
        >
          <div class="row-between">
            <div class="row" style="gap: 10px">
              <span class="alert-dot" :class="`alert-dot--${a.kind}`">
                <AppIcon name="warn" :size="16" />
              </span>
              <div>
                <div class="title-md">{{ a.title }} · {{ a.memberName }}</div>
                <div class="muted">{{ a.location }} · {{ a.time }}</div>
              </div>
            </div>
            <span class="chev" aria-hidden="true">›</span>
          </div>
        </UiCard>
      </template>

      <!-- 關注對象切換：照顧多位家人時不必再繞去成員列表 -->
      <div v-if="members.length > 1" class="row" style="flex-wrap: wrap">
        <UiChip
          v-for="m in members"
          :key="m.id"
          as="button"
          :selected="selectedId === m.id"
          @click="select(m.id)"
        >
          {{ m.name }}
        </UiChip>
      </div>

      <UiCard variant="soft" padding="0" style="overflow: hidden">
        <div class="loc-head">
          <span class="title-md">{{ selected?.name }}'s Location</span>
          <UiChip :tone="selected?.status === 'safe' ? 'green' : 'yellow'">
            {{ selected?.statusLabel }}
          </UiChip>
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

        <div class="loc-foot">
          <div>
            <div style="font-weight: 700">{{ selected?.lastLocation }}</div>
            <div class="muted">最後活動：{{ selected?.lastActivity }}</div>
          </div>
          <UiButton variant="outline" :block="false" :to="`/caregiver/members/${selected?.id}`">
            詳細
          </UiButton>
        </div>
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
  flex: none;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  display: grid;
  place-items: center;
}

.more {
  font-size: 13px;
  font-weight: 700;
  color: var(--teal);
}

.alert-dot {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--yellow-soft);
  color: #8a6400;
  display: grid;
  place-items: center;
}

.alert-dot--emergency {
  background: var(--red-soft);
  color: var(--red);
}

.chev {
  font-size: 22px;
  color: var(--ink-soft);
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

.loc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
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
