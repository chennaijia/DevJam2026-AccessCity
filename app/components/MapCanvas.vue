<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    height?: string
    showRoute?: boolean
    showFlood?: boolean
    /** 施工路段標示（企劃書 §6 導航畫面的「施工區塊」） */
    showConstruction?: boolean
    showPark?: boolean
    routePolyline?: string
    /** 拿來比較用的第二條路線（例如沒套用任何無障礙/施工考量的原始 Google 路線），用灰色虛線畫 */
    comparePolyline?: string
    markers?: { x: number; y: number; label?: string; tone?: 'teal' | 'red' | 'green' }[]
  }>(),
  { height: '220px', showPark: true, markers: () => [] },
)

const config = useRuntimeConfig()
const mapElement = ref<HTMLElement>()
const loadError = ref('')
let map: any
let routeLine: any
let compareLine: any
let currentMarker: any

declare global {
  interface Window {
    google?: any
    __accessityGoogleMapsPromise?: Promise<any>
  }
}

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (window.__accessityGoogleMapsPromise) return window.__accessityGoogleMapsPromise

  const key = config.public.googleMapsKey
  if (!key) return Promise.reject(new Error('尚未設定 NUXT_PUBLIC_GOOGLE_MAPS_KEY'))

  window.__accessityGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&language=zh-TW&region=TW`
    script.async = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Google Maps JavaScript API 載入失敗'))
    document.head.appendChild(script)
  })
  return window.__accessityGoogleMapsPromise
}

function drawRoute(maps: any) {
  routeLine?.setMap(null)
  routeLine = null
  compareLine?.setMap(null)
  compareLine = null
  if (!map || !props.routePolyline) return

  const bounds = new maps.LatLngBounds()

  // 比較用的原始路線先畫，灰色虛線墊在下面，主路線蓋在上面才看得清楚
  if (props.comparePolyline && props.comparePolyline !== props.routePolyline) {
    const comparePath = maps.geometry.encoding.decodePath(props.comparePolyline)
    compareLine = new maps.Polyline({
      map,
      path: comparePath,
      strokeOpacity: 0,
      icons: [
        {
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, scale: 3 },
          offset: '0',
          repeat: '14px',
        },
      ],
      strokeColor: '#9a978d',
      zIndex: 1,
    })
    comparePath.forEach((point: any) => bounds.extend(point))
  }

  const path = maps.geometry.encoding.decodePath(props.routePolyline)
  routeLine = new maps.Polyline({
    map,
    path,
    strokeColor: '#0b5f5c',
    strokeOpacity: 1,
    strokeWeight: 6,
    zIndex: 2,
  })
  path.forEach((point: any) => bounds.extend(point))
  map.fitBounds(bounds, 44)
}

function locateUser(maps: any) {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const position = { lat: coords.latitude, lng: coords.longitude }
    currentMarker?.setMap(null)
    currentMarker = new maps.Marker({ map, position, title: '目前位置' })
    if (!props.routePolyline) {
      map.setCenter(position)
      map.setZoom(16)
    }
  })
}

onMounted(async () => {
  try {
    const maps = await loadGoogleMaps()
    await maps.importLibrary('geometry')
    map = new maps.Map(mapElement.value, {
      center: { lat: 25.0478, lng: 121.517 },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    })
    drawRoute(maps)
    locateUser(maps)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Google Maps 載入失敗'
  }
})

watch(
  [() => props.routePolyline, () => props.comparePolyline],
  async () => {
    if (map && window.google?.maps) drawRoute(window.google.maps)
  },
)

onBeforeUnmount(() => {
  routeLine?.setMap(null)
  compareLine?.setMap(null)
  currentMarker?.setMap(null)
})
</script>

<template>
  <div class="map" :style="{ height }">
    <div ref="mapElement" class="map__google" />
    <div v-if="loadError" class="map__error">
      <strong>Google Maps 無法顯示</strong>
      <span>{{ loadError }}</span>
    </div>

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

.map__google {
  position: absolute;
  inset: 0;
}

.map__error {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 6px;
  padding: 24px;
  text-align: center;
  color: var(--ink-soft);
  background: #edefe8;
}

.map__error strong {
  color: var(--ink);
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
