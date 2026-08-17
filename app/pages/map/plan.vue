<script setup lang="ts">
/**
 * AI Requirement Confirmation（企劃書 §6）
 * 使用者說一句話 → Requirement Agent 拆成 chips → 確認後才開始規劃路線。
 */
const { destination, chips, routes, todayNeeds } = usePlanning()
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

const examples = [
  '我要去台大醫院，今天走路不太方便',
  '帶我去最近的捷運站，想避開施工',
  '想去公園走走，找有休息椅的路',
]

/** 今日需求也要出現在確認清單裡，使用者才知道系統考慮了什麼 */
const todayChips = computed(() =>
  (todayOptions.value ?? []).filter((o) => todayNeeds.value.includes(o.key)),
)

async function parse() {
  if (!text.value.trim()) return
  loading.value = true
  try {
    // TODO: 串接後端 —— POST /api/agent/requirement { text }（Requirement Agent / LLM）
    chips.value = await api.parseRequirement(text.value)
    destination.value = chips.value.find((c) => c.key === 'destination')?.label ?? text.value
    parsed.value = true
  } finally {
    loading.value = false
  }
}

function removeChip(key: string) {
  chips.value = chips.value.filter((c) => c.key !== key)
}

async function startNavigation() {
  // TODO: 串接後端 —— GET /api/routes?destination=&needs=&today=
  routes.value = await api.getRoutes(destination.value, user.value?.needs ?? [], todayNeeds.value)
  await navigateTo('/map/routes')
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
          {{ c.label }} ✕
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

    <div class="spacer" />

    <UiButton :disabled="!chips.length" @click="startNavigation">開始導航</UiButton>

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
