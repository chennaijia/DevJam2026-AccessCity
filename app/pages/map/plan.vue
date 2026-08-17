<script setup lang="ts">
/**
 * AI Requirement Confirmation（企劃書 §6）
 * 使用者說一句話 → Requirement Agent 拆成 chips → 確認後才開始規劃路線。
 */
const { destination, chips, chipNeeds, routes, todayNeeds, ignoreProfileNeeds, originPlace, resolveOrigin } =
  usePlanning()
const { user } = useSession()
const route = useRoute()
const { listen, listening, canListen, speak } = useSpeech()

// 目的地可從網址帶入（首頁常用地點 / 最近紀錄 / 重新整理都用得到）
const initialDestination = (route.query.to as string) || destination.value

// TODO: 串接後端 —— GET /api/needs/today（今日需求會併進導航條件）
const { data: todayOptions } = await useAsyncData('plan-today', () => api.getTodayNeedOptions())

const text = ref(initialDestination)
const loading = ref(false)
const parsed = ref(false)
const navError = ref('')
const navigating = ref(false)

const examples = [
  '我要去台大醫院，今天走路不太方便',
  '帶我去最近的捷運站，想避開施工',
  '想去公園走走，找有休息椅的路',
]

/** 今日需求也要出現在確認清單裡，使用者才知道系統考慮了什麼 */
const todayChips = computed(() =>
  (todayOptions.value ?? []).filter((o) => todayNeeds.value.includes(o.key)),
)

/** 有沒有真的解析出「目的地」，不是隨便把整句話當地點 */
const hasDestination = computed(() => chips.value.some((c) => c.key === 'destination' && c.label.trim()))

async function parse() {
  if (!text.value.trim()) return
  loading.value = true
  navError.value = ''
  try {
    // TODO: 串接後端 —— POST /api/agent/requirement { text }（Requirement Agent / LLM）
    chips.value = await api.parseRequirement(text.value)
    // 沒解析出目的地就不要硬把整句話當成地點——不然「輪椅」這種沒提到地點的話會被拿去查地址
    const destinationChip = chips.value.find((c) => c.key === 'destination')?.label
    if (destinationChip) destination.value = destinationChip
    // 有明確講出發點（「從政大到動物園」）才覆蓋，沒講就維持用目前定位
    originPlace.value = chips.value.find((c) => c.key === 'origin')?.label ?? ''
    parsed.value = true
  } finally {
    loading.value = false
  }
}

function removeChip(key: string) {
  chips.value = chips.value.filter((c) => c.key !== key)
  if (key === 'origin') originPlace.value = ''
}

async function startNavigation() {
  if (!hasDestination.value) {
    navError.value = '還不知道你想去哪裡，麻煩再說一次目的地。'
    return
  }

  navError.value = ''
  navigating.value = true
  try {
    // TODO: 串接後端 —— GET /api/routes?destination=&needs=&today=
    // 有明確講出發點就不用等定位（也不受定位失敗影響）
    const origin = originPlace.value ? null : await resolveOrigin()
    routes.value = await api.getRoutes(
      destination.value,
      ignoreProfileNeeds.value ? [] : (user.value?.needs ?? []),
      [...todayNeeds.value, ...chipNeeds.value],
      origin,
      null,
      originPlace.value || undefined,
    )
    await navigateTo('/map/routes')
  } catch {
    navError.value = '找不到這個地點的路線，麻煩換個講法或確認地點名稱。'
  } finally {
    navigating.value = false
  }
}

/** 語音輸入：辨識到的整句話直接交給 Requirement Agent */
async function startVoice() {
  if (!canListen()) {
    text.value = text.value || examples[0]!
    return parse()
  }
  speak('請說出你想去哪裡，還有今天的身體狀況。', { force: true })
  const heard = await listen()
  if (heard) {
    text.value = heard
    await parse()
  }
}

// 從首頁／常用地點帶著目的地進來的話，直接幫他解析好
if (initialDestination) await parse()
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="Accessity" back="/home" />

    <div>
      <h2 class="title-lg">你今天想去哪裡？</h2>
      <p class="body">
        {{ listening ? '聽你說…' : '用一句話說明就好，Mimo 會幫你整理成導航條件。' }}
      </p>
    </div>

    <!-- 測試用：帳號設定裡的固定需求（如輪椅）預設一定會送進 /api/routes，開這個開關可以只測這次對話的 chips -->
    <UiCard padding="10px 14px">
      <div class="row-between">
        <div>
          <div class="title-md">忽略帳號固定需求</div>
          <div class="muted" style="font-size: 12px">
            測試用：開啟的話，這次規劃只會用上面解析出的 chips，不會自動加上帳號設定的「{{
              (user?.needs ?? []).join('、') || '（無)'
            }}」
          </div>
        </div>
        <UiToggle v-model="ignoreProfileNeeds" label="忽略帳號固定需求" />
      </div>
    </UiCard>

    <UiCard padding="14px 16px">
      <textarea
        v-model="text"
        class="need-input"
        rows="3"
        placeholder="例如：我要去台大醫院，今天走路不太方便，也想避開施工"
        aria-label="輸入目的地與需求"
      />
      <div class="row">
        <UiButton :disabled="!text.trim() || loading" @click="parse">
          {{ loading ? 'Mimo 理解中…' : parsed ? '重新理解' : '讓 Mimo 理解' }}
        </UiButton>
        <UiButton
          variant="outline"
          :block="false"
          :aria-label="listening ? '聆聽中' : '語音輸入'"
          @click="startVoice"
        >
          <AppIcon name="mic" :size="20" />
        </UiButton>
      </div>
    </UiCard>

    <!-- 還沒輸入時給範例，降低「不知道要說什麼」的門檻 -->
    <template v-if="!chips.length">
      <div class="label">可以這樣說</div>
      <div class="stack-sm">
        <UiChip v-for="e in examples" :key="e" as="button" @click="((text = e), parse())">
          {{ e }}
        </UiChip>
      </div>
    </template>

    <template v-else>
      <div class="label">AI 解析出的需求</div>
      <div class="row" style="flex-wrap: wrap">
        <UiChip v-for="c in chips" :key="c.key" tone="green" as="button" @click="removeChip(c.key)">
          {{ c.key === 'origin' ? `從 ${c.label} 出發` : c.label }} ✕
        </UiChip>
      </div>

      <template v-if="todayChips.length">
        <div class="label">今天的身體狀況</div>
        <div class="row" style="flex-wrap: wrap">
          <UiChip v-for="c in todayChips" :key="c.key">{{ c.label }}</UiChip>
        </div>
      </template>

      <MimoBubble text="確認沒問題的話，我就幫你找最適合的路線。" />
    </template>

    <p v-if="navError" class="body" style="color: var(--red)">{{ navError }}</p>

    <div class="spacer" />

    <UiButton :disabled="!chips.length || navigating" @click="startNavigation">
      {{ navigating ? '規劃路線中…' : '開始導航' }}
    </UiButton>

    <BottomNav />
  </section>
</template>

<style scoped>
.need-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  font-weight: 600;
  background: transparent;
  margin-bottom: 10px;
}
</style>
