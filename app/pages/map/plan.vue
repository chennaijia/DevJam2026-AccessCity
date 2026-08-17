<script setup lang="ts">
/** AI Requirement Confirmation（企劃書 §6）：AI 解析出的需求變成 chips 讓使用者確認 */
const { destination, chips, routes } = usePlanning()
const { user } = useSession()

const text = ref(destination.value || '我要去台大醫院，今天走路不太方便，也想避開施工')
const loading = ref(false)

async function parse() {
  loading.value = true
  try {
    // TODO: 串接後端 —— POST /api/agent/requirement { text }（Requirement Agent / LLM）
    chips.value = await api.parseRequirement(text.value)
    destination.value = chips.value.find((c) => c.key === 'destination')?.label ?? text.value
  } finally {
    loading.value = false
  }
}

function removeChip(key: string) {
  chips.value = chips.value.filter((c) => c.key !== key)
}

async function startNavigation() {
  // TODO: 串接後端 —— GET /api/routes?destination=&needs=（Navigation Agent 會併入施工資料）
  routes.value = await api.getRoutes(destination.value, user.value?.needs ?? [])
  await navigateTo('/map/routes')
}

await parse()
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="Accessity" back="/map" />

    <div>
      <h2 class="title-lg">你今天想去哪裡？</h2>
      <p class="body">用一句話說明就好，Mimo 會幫你整理成導航條件。</p>
    </div>

    <UiCard padding="14px 16px">
      <textarea v-model="text" class="need-input" rows="3" />
      <UiButton variant="outline" :disabled="loading" @click="parse">
        {{ loading ? 'Mimo 理解中…' : '重新理解需求' }}
      </UiButton>
    </UiCard>

    <div class="label">AI 解析出的需求</div>

    <div class="row" style="flex-wrap: wrap">
      <UiChip v-for="c in chips" :key="c.key" tone="green" as="button" @click="removeChip(c.key)">
        {{ c.label }} ✕
      </UiChip>
      <span v-if="!chips.length" class="muted">還沒有需求，先描述一下你的狀況</span>
    </div>

    <MimoBubble text="確認沒問題的話，我就幫你找最適合的路線。" />

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
