<script setup lang="ts">
/**
 * 被照顧者主頁：現在位置 → 想去哪裡 → 今日狀態 → 已儲存需求 → 最近紀錄
 * 設計原則：大點擊區、少層級、語音優先，任何時候都看得到 SOS。
 */
import type { AccessNeed, User } from '#shared/types/accessity'

defineProps<{ user: User | null }>()

const { todayNeeds, toggleTodayNeed, planTo } = usePlanning()

// 一次平行取完首頁需要的資料（分開 await 會讓 SSR 等上好幾個 round trip）
const { data: home } = await useAsyncData('recipient-home', async () => {
  const [places, todayOptions, recentTrips, trip] = await Promise.all([
    api.getSavedPlaces(),
    api.getTodayNeedOptions(),
    api.getRecentTrips(),
    // 沒有進行中的行程時後端會回 404，這裡不讓它中斷整頁
    api.getCurrentTrip().catch(() => null),
  ])
  return { places, todayOptions, recentTrips, trip }
})

const places = computed(() => home.value?.places ?? [])
const todayOptions = computed(() => home.value?.todayOptions ?? [])
const recentTrips = computed(() => home.value?.recentTrips ?? [])
const trip = computed(() => home.value?.trip ?? null)

const onTrip = computed(() => trip.value?.status === 'on-trip')

const needLabels: Record<AccessNeed, string> = {
  wheelchair: '輪椅可行',
  mobility: '行動協助',
  visual: '語音導航',
  other: '其他需求',
}

</script>

<template>
  <section class="screen screen--nav">
    <header class="row-between">
      <div>
        <h1 class="title-xl">哈囉，{{ user?.name?.split(' ')[0] ?? '你' }}</h1>
        <p class="body">今天想去哪裡？我陪你走。</p>
      </div>
      <NuxtLink to="/mimo" class="mimo-avatar" aria-label="和 Mimo 說話">
        <MimoMascot :size="46" />
      </NuxtLink>
    </header>

    <!-- 進行中的行程：最優先，讓使用者一鍵回到導航 -->
    <UiCard v-if="onTrip" variant="active" padding="14px 16px">
      <div class="row-between">
        <div>
          <div class="row" style="gap: 6px; color: var(--green-strong)">
            <AppIcon name="activity" :size="16" />
            <span class="muted" style="color: var(--green-strong); font-weight: 700">行程進行中</span>
          </div>
          <div class="title-md">{{ trip?.destination }}</div>
          <div class="muted">預計 {{ trip?.eta }} 抵達</div>
        </div>
        <UiButton :block="false" to="/map/navigate">繼續導航</UiButton>
      </div>
    </UiCard>

    <!-- 現在位置 -->
    <UiCard padding="14px 16px">
      <div class="row-between">
        <div class="row" style="gap: 10px">
          <span class="loc-dot"><AppIcon name="pin" :size="18" /></span>
          <div>
            <div class="muted">現在位置</div>
            <div class="title-md">{{ trip?.currentLocation ?? '中山南路近仁愛路口' }}</div>
          </div>
        </div>
        <span class="muted">剛剛更新</span>
      </div>
      <div v-if="user?.connectedCaregiver" class="share-row">
        <AppIcon name="check" :size="14" />
        <span>位置分享中 · {{ user.connectedCaregiver.name }}</span>
      </div>
    </UiCard>

    <!-- 現在位置的地圖：抓瀏覽器定位、標出目前位置 -->
    <MapCanvas height="180px" class="location-map" />

    <!-- 常用地點 -->
    <div class="label">常用地點</div>
    <div class="places">
      <button
        v-for="p in places"
        :key="p.id"
        type="button"
        class="place"
        :class="{ 'place--primary': p.primary }"
        @click="planTo(p.label === '回家' ? p.address : p.label)"
      >
        <AppIcon :name="p.icon" :size="20" />
        <span class="place__label">{{ p.label }}</span>
        <span class="place__addr">{{ p.address }}</span>
      </button>
    </div>

    <!-- 今日狀態（暫時性需求） -->
    <div class="row-between">
      <span class="label">今天的身體狀況</span>
      <span class="muted">只影響今天</span>
    </div>
    <div class="row" style="flex-wrap: wrap">
      <UiChip
        v-for="opt in todayOptions"
        :key="opt.key"
        as="button"
        :selected="todayNeeds.includes(opt.key)"
        :aria-pressed="todayNeeds.includes(opt.key)"
        @click="toggleTodayNeed(opt.key)"
      >
        {{ opt.label }}
      </UiChip>
    </div>

    <!-- 已儲存的需求 -->
    <div class="row-between">
      <span class="label">已儲存的需求</span>
      <NuxtLink to="/onboarding/needs" class="muted" style="color: var(--teal); font-weight: 700">
        編輯
      </NuxtLink>
    </div>
    <UiCard variant="soft" padding="12px 14px">
      <div class="row" style="flex-wrap: wrap">
        <UiChip v-for="n in user?.needs" :key="n" tone="green">{{ needLabels[n] }}</UiChip>
        <span v-if="!user?.needs?.length" class="muted">還沒設定，導航會用一般步行路線</span>
      </div>
    </UiCard>

    <!-- 最近紀錄 -->
    <div class="row-between">
      <span class="label">最近紀錄</span>
      <NuxtLink to="/report" class="muted" style="color: var(--teal); font-weight: 700">
        回報路況
      </NuxtLink>
    </div>
    <UiCard v-for="t in recentTrips" :key="t.id" variant="soft" padding="12px 14px">
      <div class="row-between">
        <div class="row" style="gap: 10px">
          <span class="trip-dot" :class="`trip-dot--${t.status}`">
            <AppIcon :name="t.status === 'arrived' ? 'check' : 'close'" :size="16" />
          </span>
          <div>
            <div class="title-md">{{ t.destination }}</div>
            <div class="muted">
              {{ t.dateLabel }} · {{ t.durationLabel }} · {{ t.distanceLabel }}
            </div>
          </div>
        </div>
        <!-- TODO: 串接後端 —— POST /api/trips（帶上同一個目的地重新規劃） -->
        <UiChip as="button" @click="planTo(t.destination)">再走一次</UiChip>
      </div>
    </UiCard>

    <BottomNav />
    <SafetyOverlay />
  </section>
</template>

<style scoped>
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

.loc-dot {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--teal-tint);
  color: var(--teal);
  display: grid;
  place-items: center;
}

.location-map {
  box-shadow: var(--shadow-card);
}

.share-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  color: var(--green-strong);
  font-size: 13px;
  font-weight: 600;
}

.places {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.place {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 84px;
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.place--primary {
  background: var(--teal);
  border-color: var(--teal);
  color: #fff;
}

.place__label {
  font-size: 16px;
  font-weight: 700;
  margin-top: 4px;
}

.place__addr {
  font-size: 12px;
  opacity: 0.7;
}

.trip-dot {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--green-soft);
  color: var(--green-strong);
  display: grid;
  place-items: center;
}

.trip-dot--stopped {
  background: var(--red-soft);
  color: var(--red);
}
</style>
