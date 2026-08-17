<script setup lang="ts">
/** Mimo：Requirement Agent 的對話介面（語音 / 文字皆可） */
const { destination, chips } = usePlanning()

interface Message {
  id: number
  from: 'mimo' | 'me'
  text: string
}

const messages = ref<Message[]>([
  { id: 1, from: 'mimo', text: '嗨，我是 Mimo。今天想去哪裡呢？可以順便告訴我身體狀況。' },
])
const input = ref('')
const thinking = ref(false)

const quickPrompts = ['我要去最近的捷運站', '今天腳比較痠，想少走一點', '想避開施工路段']

async function send(text?: string) {
  const content = (text ?? input.value).trim()
  if (!content) return
  messages.value.push({ id: Date.now(), from: 'me', text: content })
  input.value = ''
  thinking.value = true

  // TODO: 串接後端 —— POST /api/agent/requirement { text }
  //       後端的 Requirement Agent 回傳結構化條件 + 一句自然語言回覆
  chips.value = await api.parseRequirement(content)
  destination.value = chips.value.find((c) => c.key === 'destination')?.label ?? destination.value

  messages.value.push({
    id: Date.now() + 1,
    from: 'mimo',
    text: '我整理好你的需求了，確認一下就可以出發。',
  })
  thinking.value = false
}

function startVoice() {
  // TODO: 串接語音輸入 —— Web Speech API / 後端 STT
  send('我要去台大醫院，今天走路不太方便，也想避開施工')
}
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="Mimo" back />

    <div class="chat">
      <div v-for="m in messages" :key="m.id" class="msg" :class="`msg--${m.from}`">
        <MimoMascot v-if="m.from === 'mimo'" :size="36" />
        <div class="bubble" :class="`bubble--${m.from}`">{{ m.text }}</div>
      </div>
      <div v-if="thinking" class="muted">Mimo 思考中…</div>
    </div>

    <div v-if="chips.length" class="stack-sm">
      <div class="label">整理出的需求</div>
      <div class="row" style="flex-wrap: wrap">
        <UiChip v-for="c in chips" :key="c.key" tone="green">{{ c.label }}</UiChip>
      </div>
      <UiButton to="/map/routes">看看適合的路線</UiButton>
    </div>

    <div class="label">快速說法</div>
    <div class="row" style="flex-wrap: wrap">
      <UiChip v-for="q in quickPrompts" :key="q" as="button" @click="send(q)">{{ q }}</UiChip>
    </div>

    <div class="spacer" />

    <div class="composer">
      <input v-model="input" class="input" placeholder="想去哪裡？" @keyup.enter="send()" />
      <UiButton :block="false" aria-label="語音輸入" @click="startVoice">🎤</UiButton>
    </div>

    <BottomNav />
  </section>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.msg--me {
  justify-content: flex-end;
}

.bubble {
  max-width: 78%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  font-size: 15px;
  font-weight: 600;
}

.bubble--mimo {
  background: var(--surface);
}

.bubble--me {
  background: var(--green);
}

.composer {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
