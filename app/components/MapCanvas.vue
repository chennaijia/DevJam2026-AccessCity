<script setup lang="ts">
/**
 * 假地圖（demo 用的示意底圖）。街廓用 CSS 漸層鋪，所以在任何尺寸下都不會變形。
 * TODO: 串接 Google Maps —— 用 @googlemaps/js-api-loader 或 vue3-google-map 取代整個元件內容，
 *       路線 polyline 由 /api/routes 回傳的 encoded polyline 解出來畫，
 *       施工／淹水區塊由城市開放資料的 GeoJSON 疊圖。
 */
withDefaults(
  defineProps<{
    height?: string
    showRoute?: boolean
    showFlood?: boolean
    showPark?: boolean
    markers?: { x: number; y: number; label?: string; tone?: 'teal' | 'red' | 'green' }[]
  }>(),
  { height: '220px', showPark: true, markers: () => [] },
)
</script>

<template>
  <div class="map" :style="{ height }">
    <div class="map__streets" aria-hidden="true" />

    <div v-if="showPark" class="map__park" aria-hidden="true">
      <span>Central Park</span>
    </div>

    <svg class="map__river" viewBox="0 0 390 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 52C90 34 150 66 220 46S330 20 390 34" stroke="#bcd7e6" stroke-width="18" fill="none" />
    </svg>

    <svg
      v-if="showFlood"
      class="map__flood"
      viewBox="0 0 390 140"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 40C90 18 150 62 230 36S330 8 390 24V104C330 88 250 116 170 100S60 108 0 118Z"
        fill="#ef9f5c"
        opacity="0.5"
      />
    </svg>

    <svg
      v-if="showRoute"
      class="map__route"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        d="M18 86L18 60L46 60L46 30L76 30L76 14"
        stroke="var(--teal)"
        stroke-width="6"
        vector-effect="non-scaling-stroke"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <span
      v-for="(m, i) in markers"
      :key="i"
      class="map__marker"
      :class="`map__marker--${m.tone ?? 'teal'}`"
      :style="{ left: `${m.x}%`, top: `${m.y}%` }"
    >
      {{ m.label ?? '' }}
    </span>

    <div class="map__overlay">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.map {
  position: relative;
  width: 100%;
  border-radius: var(--radius);
  overflow: hidden;
  background: #edefe8;
}

/* 街廓：大馬路（白色）+ 小巷（淺灰） */
.map__streets {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      to right,
      transparent 0 62px,
      #ffffff 62px 70px,
      transparent 70px 132px
    ),
    repeating-linear-gradient(
      to bottom,
      transparent 0 58px,
      #ffffff 58px 66px,
      transparent 66px 124px
    ),
    repeating-linear-gradient(to right, transparent 0 31px, #e5e7df 31px 33px),
    repeating-linear-gradient(to bottom, transparent 0 29px, #e5e7df 29px 31px);
}

.map__park {
  position: absolute;
  left: 14%;
  top: 26%;
  width: 30%;
  height: 15%;
  border-radius: 10px;
  background: #cfe6c4;
  display: grid;
  place-items: center;
  font-size: 11px;
  color: #56704b;
}

.map__river {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4%;
  height: 22%;
}

.map__flood {
  position: absolute;
  left: 0;
  right: 0;
  top: 34%;
  height: 46%;
}

.map__route {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.map__marker {
  position: absolute;
  transform: translate(-50%, -50%);
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.map__marker--teal {
  background: var(--teal);
}

.map__marker--red {
  background: var(--red);
}

.map__marker--green {
  background: var(--green-strong);
}

.map__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.map__overlay :deep(*) {
  pointer-events: auto;
}
</style>
