<script setup lang="ts">
import type { SavedPlace } from '#shared/types/accessity'

const { data: places } = await useAsyncData('settings-places', () => api.getSavedPlaces())

const ICONS: SavedPlace['icon'][] = ['house', 'pin', 'walk', 'shield']

const showForm = ref(false)
const editingId = ref<string | null>(null)
const error = ref('')
const form = reactive<{ label: string; address: string; icon: SavedPlace['icon'] }>({
  label: '',
  address: '',
  icon: 'pin',
})

function openAdd() {
  editingId.value = null
  form.label = ''
  form.address = ''
  form.icon = 'pin'
  showForm.value = true
}

function openEdit(place: SavedPlace) {
  editingId.value = place.id
  form.label = place.label
  form.address = place.address
  form.icon = place.icon
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
}

function save() {
  if (!form.label.trim() || !form.address.trim()) return
  const previous = [...(places.value ?? [])]
  const payload = { ...form }
  error.value = ''

  if (editingId.value) {
    const id = editingId.value
    places.value = previous.map((place) => (place.id === id ? { ...place, ...payload } : place))
    runInBackground(api.updateSavedPlace(id, payload), {
      label: 'places:update',
      onError: () => {
        places.value = previous
        error.value = '地址儲存失敗，請再試一次'
      },
    })
  } else {
    const temporaryId = `pending-${Date.now()}`
    places.value = [...previous, { id: temporaryId, ...payload }]
    runInBackground(
      api.addSavedPlace(payload).then((saved) => {
        places.value = (places.value ?? []).map((place) =>
          place.id === temporaryId ? saved : place,
        )
      }),
      {
        label: 'places:add',
        onError: () => {
          places.value = (places.value ?? []).filter((place) => place.id !== temporaryId)
          error.value = '地址新增失敗，請再試一次'
        },
      },
    )
  }
  cancelForm()
}

function remove(place: SavedPlace) {
  const previous = [...(places.value ?? [])]
  places.value = previous.filter((item) => item.id !== place.id)
  if (editingId.value === place.id) cancelForm()
  runInBackground(api.deleteSavedPlace(place.id), {
    label: 'places:delete',
    onError: () => {
      places.value = previous
      error.value = '地址刪除失敗，請再試一次'
    },
  })
}
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="常用地址" back="/profile" />

    <p class="body">儲存常用的地址，下次導航時可以快速選取，不用每次重新輸入。</p>
    <p v-if="error" class="body" style="color: var(--red)">{{ error }}</p>

    <div class="label">已儲存的地址</div>
    <div class="stack">
      <UiCard v-for="p in places" :key="p.id" padding="12px 14px" style="cursor: pointer" @click="openEdit(p)">
        <div class="row-between">
          <div class="row" style="gap: 10px">
            <AppIcon :name="p.icon" :size="18" />
            <div>
              <div class="title-md">{{ p.label }}</div>
              <div class="muted">{{ p.address }}</div>
            </div>
          </div>
          <button type="button" class="icon-btn" aria-label="刪除" @click.stop="remove(p)">
            <AppIcon name="close" :size="16" />
          </button>
        </div>
      </UiCard>
      <p v-if="places && !places.length" class="muted">還沒有儲存任何地址。</p>
    </div>

    <UiCard v-if="showForm" padding="14px 16px">
      <div class="label" style="margin-top: 0">{{ editingId ? '編輯地址' : '新增地址' }}</div>
      <input v-model="form.label" class="field" placeholder="名稱，例如：家、公司" aria-label="名稱" />
      <input v-model="form.address" class="field" placeholder="地址" aria-label="地址" />
      <div class="row" style="flex-wrap: wrap; margin: 8px 0">
        <UiChip
          v-for="icon in ICONS"
          :key="icon"
          as="button"
          :selected="form.icon === icon"
          @click="form.icon = icon"
        >
          <AppIcon :name="icon" :size="16" />
        </UiChip>
      </div>
      <div class="row">
        <UiButton :disabled="!form.label.trim() || !form.address.trim()" @click="save">
          儲存
        </UiButton>
        <UiButton variant="outline" :block="false" @click="cancelForm">取消</UiButton>
      </div>
    </UiCard>

    <UiButton v-else variant="ghost" @click="openAdd">
      <AppIcon name="plus" :size="18" />
      新增常用地址
    </UiButton>

    <BottomNav />
  </section>
</template>

<style scoped>
.field {
  width: 100%;
  border: 2px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 15px;
  margin-bottom: 8px;
  background: var(--surface);
}

.icon-btn {
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  padding: 6px;
}
</style>
