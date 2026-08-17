<script setup lang="ts">
const types = [
  { key: 'construction', label: '施工封閉' },
  { key: 'obstacle', label: '路面障礙' },
  { key: 'elevator', label: '電梯故障' },
  { key: 'no-ramp', label: '沒有坡道' },
]

const type = ref('construction')
const note = ref('')
const done = ref(false)

function submit() {
  // TODO: 串接後端 —— POST /api/reports { type, note, lat, lng, photo }
  //       群眾回報之後會餵回路線評分（企劃書 Future Work：群眾回報）
  const payload = { type: type.value, note: note.value }
  done.value = true
  note.value = ''
  runInBackground(api.reportIssue(payload), {
    label: 'report:submit',
    onError: () => {
      done.value = false
      note.value = payload.note
    },
  })
}
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="回報路況" back />

    <div>
      <h2 class="title-xl">回報路況</h2>
      <p class="body">你的回報會幫助其他使用者避開不好走的路。</p>
    </div>

    <MapCanvas height="150px" :markers="[{ x: 50, y: 52, label: '', tone: 'red' }]" />

    <div class="label">問題類型</div>
    <div class="row" style="flex-wrap: wrap">
      <UiChip
        v-for="t in types"
        :key="t.key"
        as="button"
        :selected="type === t.key"
        @click="type = t.key"
      >
        {{ t.label }}
      </UiChip>
    </div>

    <div class="label">補充說明</div>
    <UiCard padding="14px 16px">
      <textarea v-model="note" class="note-input" rows="4" placeholder="例如：人行道被圍籬擋住，只能繞到對面。" />
    </UiCard>

    <!-- TODO: 串接檔案上傳 —— POST /api/reports/photo（multipart） -->
    <UiButton variant="outline">＋ 加上照片</UiButton>

    <UiButton @click="submit">送出回報</UiButton>
    <p v-if="done" class="center" style="color: var(--green-strong); font-weight: 700">
      已收到你的回報，謝謝！
    </p>

    <BottomNav />
  </section>
</template>

<style scoped>
.note-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-size: 15px;
}
</style>
