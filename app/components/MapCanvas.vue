<script setup lang="ts">
/** 地圖上的吉祥物 icon 標點；有 title/lines 的話點下去會跳出詳細資訊 */
interface IconMarker {
  lat: number
  lng: number
  label?: string
  /** 資訊視窗標題，沒給就用 label */
  title?: string
  /** 資訊視窗內容，一行一句；空字串會被略過 */
  lines?: string[]
  /** 標題旁的狀態標籤，例如「完全封閉」 */
  status?: { text: string; tone: 'red' | 'grey' }
}

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
    /** 施工地點——勾 Safety 時用吉祥物 icon 標示（IMG_4703.png） */
    constructionMarkers?: IconMarker[]
    /** 輪行台北無障礙通行點——勾 Wheelchair 時用吉祥物 icon 標示（IMG_4704.png） */
    facilityMarkers?: IconMarker[]
  }>(),
  {
    height: '220px',
    showPark: true,
    markers: () => [],
    constructionMarkers: () => [],
    facilityMarkers: () => [],
  },
)

const config = useRuntimeConfig()
const mapElement = ref<HTMLElement>()
const loadError = ref('')
let map: any
let routeLine: any
let compareLine: any
let currentMarker: any
let constructionMarkerObjs: any[] = []
let facilityMarkerObjs: any[] = []
/** 全圖共用一個資訊視窗，點下一個標點時上一個會自動關掉 */
let infoWindow: any

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

/**
 * 組出資訊視窗的內容。
 * 一律用 DOM + textContent，不要用 HTML 字串——施工資料是外部開放資料，
 * 路名/施工項目直接塞進 innerHTML 會有注入風險。
 */
function buildInfoContent(point: IconMarker) {
  const box = document.createElement('div')
  box.className = 'map-info'

  const heading = document.createElement('div')
  heading.className = 'map-info__head'
  const title = document.createElement('strong')
  title.textContent = point.title || point.label || '施工路段'
  heading.appendChild(title)
  if (point.status) {
    const status = document.createElement('span')
    status.className = `map-info__status map-info__status--${point.status.tone}`
    status.textContent = point.status.text
    heading.appendChild(status)
  }
  box.appendChild(heading)

  for (const line of point.lines ?? []) {
    if (!line) continue
    const row = document.createElement('p')
    row.className = 'map-info__line'
    row.textContent = line
    box.appendChild(row)
  }
  return box
}

/** 圖檔的長寬比（url → width/height），避免把直式圖硬塞進正方形而變形 */
const iconAspects = new Map<string, number>()

function loadIconAspect(url: string): Promise<number> {
  const cached = iconAspects.get(url)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight || 1
      iconAspects.set(url, aspect)
      resolve(aspect)
    }
    img.onerror = () => resolve(1)
    img.src = url
  })
}

/** 用同一隻 icon（不同圖檔）畫一組定點 marker，畫之前先清掉上一批 */
async function drawIconMarkers(
  maps: any,
  existing: any[],
  points: IconMarker[],
  iconUrl: string,
  height = 28,
) {
  existing.forEach((m) => m.setMap(null))
  existing.length = 0
  // 上一批標點裡如果有開著的資訊視窗，標點都清掉了就不該再留著
  infoWindow?.close()
  if (!map || !points.length) return

  // 依原圖比例算寬度，並把錨點放在圖的底部中央（像圖釘的針尖）
  const aspect = await loadIconAspect(iconUrl)
  const width = Math.max(12, Math.round(height * aspect))
  const size = new maps.Size(width, height)
  const anchor = new maps.Point(width / 2, height)

  for (const point of points) {
    const marker = new maps.Marker({
      map,
      position: { lat: point.lat, lng: point.lng },
      title: point.label,
      icon: { url: iconUrl, scaledSize: size, anchor },
    })
    if (point.lines?.length || point.title) {
      marker.addListener('click', () => {
        infoWindow ??= new maps.InfoWindow({ maxWidth: 260 })
        infoWindow.setContent(buildInfoContent(point))
        infoWindow.open({ map, anchor: marker })
      })
    }
    existing.push(marker)
  }
}

// 檔名大小寫要跟 public/ 裡的實際檔案一致：macOS 不分大小寫，但部署到 Linux 會 404
function drawConstructionMarkers(maps: any) {
  // 施工點數量少但重要，畫大一點
  drawIconMarkers(
    maps,
    constructionMarkerObjs,
    props.showConstruction ? props.constructionMarkers : [],
    '/IMG_4703.png',
    32,
  )
}

function drawFacilityMarkers(maps: any) {
  // 無障礙通行點可能有幾十個，小一點才不會把地圖蓋掉
  drawIconMarkers(maps, facilityMarkerObjs, props.facilityMarkers, '/icon.png', 24)
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
    drawConstructionMarkers(maps)
    drawFacilityMarkers(maps)
    locateUser(maps)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Google Maps 載入失敗'
  }
})

watch([() => props.routePolyline, () => props.comparePolyline], async () => {
  if (map && window.google?.maps) drawRoute(window.google.maps)
})

watch([() => props.constructionMarkers, () => props.showConstruction], () => {
  if (map && window.google?.maps) drawConstructionMarkers(window.google.maps)
})

watch(
  () => props.facilityMarkers,
  () => {
    if (map && window.google?.maps) drawFacilityMarkers(window.google.maps)
  },
)

onBeforeUnmount(() => {
  routeLine?.setMap(null)
  compareLine?.setMap(null)
  currentMarker?.setMap(null)
  infoWindow?.close()
  constructionMarkerObjs.forEach((m) => m.setMap(null))
  facilityMarkerObjs.forEach((m) => m.setMap(null))
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

<!-- 資訊視窗的內容是 document.createElement 建出來的，不會帶 scoped 屬性，這段不能加 scoped -->
<style>
.map-info {
  max-width: 240px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink, #2b2a26);
}

.map-info__head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 4px;
  font-size: 14px;
}

.map-info__status {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.map-info__status--red {
  background: var(--red-soft, #fdeceb);
  color: var(--red, #c0392b);
}

.map-info__status--grey {
  background: #eeece6;
  color: #6b675e;
}

.map-info__line {
  margin: 2px 0;
  color: var(--ink-soft, #6b675e);
}
</style>
