<script setup lang="ts">
const { destination, planTo, todayNeeds, toggleTodayNeed } = usePlanning()
const { listen, listening, canListen } = useSpeech()

// 常用地址：跟 /home、/settings/places 讀同一份資料，點了直接帶進 Requirement Agent
const { data: savedPlaces } = await useAsyncData('map-home-places', () => api.getSavedPlaces())

const filters = [
  { key: 'wheelchair', label: '輪椅可行' },
  { key: 'safety', label: '避開施工' },
]
// safety 對應到後端既有的 avoid-construction 需求 key（跟「今天想避開施工」是同一個判斷邏輯）
const FILTER_TO_NEED: Record<string, string> = { wheelchair: 'wheelchair', safety: 'avoid-construction' }
const active = computed(() => filters.map((f) => f.key).filter((k) => todayNeeds.value.includes(FILTER_TO_NEED[k]!)))

function toggleFilter(key: string) {
  toggleTodayNeed(FILTER_TO_NEED[key]!)
}

/** 語音輸入：聽一句話 → 直接帶進 Requirement Agent */
async function startVoice() {
  if (!canListen()) {
    // 瀏覽器不支援時降級成手動輸入
    destination.value = destination.value || '台大醫院'
    return
  }
  const heard = await listen()
  if (heard) await planTo(heard)
}

async function startPlanning() {
  // 搜尋框內容直接帶進 Requirement Agent
  await planTo(destination.value)
}
</script>

<template>
  <section class="screen screen--flush screen--nav map-home">
    <MapCanvas
      height="100%"
      class="map-home__bg"
      :markers="[
        { x: 30, y: 46, label: '', tone: 'teal' },
        { x: 62, y: 34, label: '', tone: 'green' },
      ]"
    />

    <div class="map-home__top">
      <header class="row-between">
        <AppLogo :size="26" :text-size="22" />
        <button class="icon-btn" aria-label="通知" @click="navigateTo('/notifications')">
          <AppIcon name="bell" :size="22" />
        </button>
      </header>

      <div class="search">
        <AppIcon name="search" :size="20" />
        <input v-model="destination" class="search__input" placeholder="接下來要去哪裡？" />
        <button
          class="icon-btn"
          :class="{ 'icon-btn--listening': listening }"
          :aria-label="listening ? '聆聽中' : '語音輸入'"
          @click="startVoice"
        >
          <AppIcon name="mic" :size="20" />
        </button>
      </div>
      <p class="muted" style="padding-left: 6px">
        {{ listening ? '聽你說…' : '可以這樣說：「找捷運站附近有斜坡道的路」' }}
      </p>

      <div class="row" style="flex-wrap: wrap">
        <UiChip
          v-for="f in filters"
          :key="f.key"
          as="button"
          hard
          :selected="active.includes(f.key)"
          @click="toggleFilter(f.key)"
        >
          {{ f.label }}
        </UiChip>
      </div>

      <div v-if="savedPlaces?.length" class="row" style="flex-wrap: wrap">
        <UiChip
          v-for="p in savedPlaces"
          :key="p.id"
          as="button"
          hard
          @click="planTo(p.label === '回家' ? p.address : p.label)"
        >
          <AppIcon :name="p.icon" :size="14" />
          {{ p.label }}
        </UiChip>
      </div>
    </div>

    <div class="map-home__bottom">
      <MimoBubble text="今天想去哪裡呢？" hard />
      <UiButton hard @click="startPlanning">開始規劃路線 →</UiButton>
    </div>

    <BottomNav />
  </section>
</template>

<style scoped>
.map-home {
  position: relative;
  min-height: 100dvh;
}

.map-home__bg {
  position: absolute;
  inset: 0;
  border-radius: 0;
}

.map-home__top {
  position: relative;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-home__bottom {
  position: relative;
  margin-top: auto;
  padding: 16px 16px 104px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface);
  border: 2px solid var(--line-strong);
  border-radius: 999px;
  box-shadow: var(--shadow-hard);
}

.search__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 600;
  background: transparent;
}

.icon-btn--listening {
  color: var(--red);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.4;
  }
}

.icon-btn {
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  padding: 4px;
}
</style>
