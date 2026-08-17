<script setup lang="ts">
/**
 * 可就地編輯的資料列（Profile 的姓名用）。
 * 點一下展開輸入框，儲存後把新值交給呼叫端去打 API。
 */
const props = defineProps<{
  label: string
  value: string
  placeholder?: string
  maxlength?: number
  /** 回傳錯誤訊息代表存檔失敗；回傳 undefined 代表成功 */
  onSave: (value: string) => Promise<string | undefined | void>
}>()

const editing = ref(false)
const draft = ref(props.value)
const saving = ref(false)
const error = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

watch(
  () => props.value,
  (next) => {
    if (!editing.value) draft.value = next
  },
)

async function start() {
  draft.value = props.value
  error.value = ''
  editing.value = true
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select()
}

function cancel() {
  editing.value = false
  error.value = ''
  draft.value = props.value
}

async function save() {
  const next = draft.value.trim()
  if (!next) {
    error.value = '不能留空'
    return
  }
  if (next === props.value) {
    editing.value = false
    return
  }

  saving.value = true
  try {
    const message = await props.onSave(next)
    if (message) {
      error.value = message
      return
    }
    editing.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UiCard padding="14px 16px">
    <!-- 檢視狀態 -->
    <button v-if="!editing" type="button" class="row-between view" @click="start">
      <span>
        <span class="muted">{{ label }}</span>
        <span class="title-md value">{{ value || '—' }}</span>
      </span>
      <span class="edit">編輯</span>
    </button>

    <!-- 編輯狀態 -->
    <div v-else class="stack-sm">
      <label class="muted" :for="`field-${label}`">{{ label }}</label>
      <input
        :id="`field-${label}`"
        ref="inputEl"
        v-model="draft"
        class="input"
        :placeholder="placeholder"
        :maxlength="maxlength ?? 30"
        @keyup.enter="save"
        @keyup.esc="cancel"
      />
      <p v-if="error" class="muted" style="color: var(--red)">{{ error }}</p>
      <div class="row">
        <UiButton :disabled="saving" @click="save">{{ saving ? '儲存中…' : '儲存' }}</UiButton>
        <UiButton variant="ghost" :disabled="saving" @click="cancel">取消</UiButton>
      </div>
    </div>
  </UiCard>
</template>

<style scoped>
.view {
  width: 100%;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  color: inherit;
}

.value {
  display: block;
}

.edit {
  flex: none;
  font-size: 13px;
  font-weight: 700;
  color: var(--teal);
}
</style>
