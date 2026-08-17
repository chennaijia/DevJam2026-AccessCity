<script setup lang="ts">
const { destination, planTo, todayNeeds, toggleTodayNeed } = usePlanning()
const { listen, listening, canListen } = useSpeech()

const filters = [
  { key: 'wheelchair', label: 'Wheelchair' },
  { key: 'coolest', label: 'Coolest' },
  { key: 'safety', label: 'Safety' },
]
// safety 對應到後端既有的 avoid-construction 需求 key（跟「今天想避開施工」是同一個判斷邏輯）
const FILTER_TO_NEED: Record<string, string> = { wheelchair: 'wheelchair', coolest: 'coolest', safety: 'avoid-construction' }
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
        <h1 class="brand">Accessity</h1>
        <button class="icon-btn" aria-label="通知" @click="navigateTo('/notifications')">
          <AppIcon name="bell" :size="22" />
        </button>
      </header>

      <div class="search">
        <AppIcon name="search" :size="20" />
        <input v-model="destination" class="search__input" placeholder="Where to next?" />
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
        {{ listening ? '聽你說…' : 'Try "Find a ramp near the station."' }}
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
    </div>

    <div class="map-home__bottom">
      <MimoBubble text="Where would you like to go today?" hard />
      <UiButton hard @click="startPlanning">Start Planning →</UiButton>
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
