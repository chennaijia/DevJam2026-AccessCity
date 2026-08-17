<script setup lang="ts">
const { isCaregiver, user, ensureUser } = useSession()
const { destination } = usePlanning()
await ensureUser()

// TODO: 串接後端 —— GET /api/trips/overview、GET /api/trips/current、GET /api/members
const { data: overview } = await useAsyncData('overview', () => api.getWeeklyOverview())
const { data: trip } = await useAsyncData('current-trip', () => api.getCurrentTrip())
const { data: members } = await useAsyncData('members-home', () => api.getMembers())

const monitored = computed(() => members.value?.[0])

const quickPlaces = ['家', '醫院', '公園', '捷運站']

function planTo(place: string) {
  destination.value = place
  return navigateTo('/map/plan')
}
</script>

<template>
  <!-- ------------------------------------------------------ 照顧者 Home -->
  <section v-if="isCaregiver" class="screen screen--flush screen--nav">
    <AlertBanner
      tone="yellow"
      title="Stationary Alert"
      message="Alex has been at Main St. for 15 mins. Check in?"
    >
      <template #action>
        <UiButton variant="dark" :block="false" to="/caregiver/alerts/safety">Contact</UiButton>
      </template>
    </AlertBanner>

    <div class="body-pad">
      <div class="row-between">
        <div>
          <div class="title-md">Caregiver Dashboard</div>
          <div class="row" style="gap: 6px; color: var(--green-strong)">
            <AppIcon name="chart" :size="16" />
            <span class="muted">Currently Monitoring: <b>{{ monitored?.name }}</b></span>
          </div>
        </div>
        <MimoMascot :size="44" />
      </div>

      <UiCard variant="soft" padding="12px">
        <div class="row-between">
          <span class="title-md">{{ monitored?.name }}'s Location</span>
          <span class="muted">Updated 2 mins ago</span>
        </div>
        <MapCanvas height="180px" show-route style="margin-top: 10px" :markers="[
          { x: 24, y: 62, label: '', tone: 'teal' },
          { x: 72, y: 34, label: '', tone: 'green' },
        ]" />
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
            <div class="stat__num">{{ overview?.safeArrivals }}</div>
            <div class="muted">Safe Arrivals</div>
          </div>
        </div>
      </UiCard>

      <UiCard variant="soft" padding="14px 16px">
        <div class="row" style="gap: 8px; color: var(--teal)">
          <AppIcon name="clock" :size="18" /><span class="title-md">Recent Activity</span>
        </div>
        <div class="stack" style="margin-top: 10px">
          <div v-for="a in overview?.recentActivity" :key="a.id" class="row">
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

      <UiCard variant="soft" padding="14px 16px">
        <div class="title-md">Trip Timeline</div>
        <ol class="timeline">
          <li v-for="e in trip?.events" :key="e.id">
            <b>{{ e.time }}</b> — {{ e.title }}
            <div class="muted">{{ e.detail }}</div>
          </li>
        </ol>
      </UiCard>
    </div>

    <BottomNav />
  </section>

  <!-- --------------------------------------------------- 被照顧者 Home -->
  <section v-else class="screen screen--nav">
    <div>
      <h1 class="title-xl">哈囉，{{ user?.name }}</h1>
      <p class="body">你今天想去哪裡？</p>
    </div>

    <UiCard padding="14px 16px">
      <div class="muted">現在位置</div>
      <div class="title-md">Main St. near 4th Ave</div>
    </UiCard>

    <UiButton to="/map/plan">
      <AppIcon name="mic" :size="18" />
      用說的告訴 Mimo
    </UiButton>

    <div class="label">常用地點</div>
    <div class="row" style="flex-wrap: wrap">
      <UiChip v-for="p in quickPlaces" :key="p" as="button" @click="planTo(p)">{{ p }}</UiChip>
    </div>

    <div class="label">已儲存的需求</div>
    <div class="row" style="flex-wrap: wrap">
      <UiChip v-for="n in user?.needs" :key="n" tone="green">{{
        n === 'wheelchair' ? '輪椅可行' : n === 'mobility' ? '行動協助' : n === 'visual' ? '語音導航' : '其他'
      }}</UiChip>
    </div>

    <div class="label">最近行程</div>
    <UiCard v-for="e in trip?.events.slice(0, 3)" :key="e.id" variant="soft" padding="12px 14px">
      <div class="row-between">
        <div>
          <div class="title-md">{{ e.title }}</div>
          <div class="muted">{{ e.detail }}</div>
        </div>
        <span class="muted">{{ e.time }}</span>
      </div>
    </UiCard>

    <BottomNav />
    <SafetyOverlay />
  </section>
</template>

<style scoped>
.body-pad {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 100px;
}

.stat {
  flex: 1;
  background: #eef4f2;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}

.stat__num {
  font-size: 26px;
  font-weight: 800;
  color: var(--teal);
}

.bullet {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--green);
  display: grid;
  place-items: center;
}

.bullet--arrival {
  background: var(--teal);
  color: #fff;
}

.timeline {
  margin: 10px 0 0;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}
</style>
