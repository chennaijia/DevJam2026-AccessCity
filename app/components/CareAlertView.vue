<script setup lang="ts">
import type { CareAlert } from '#shared/types/accessity'

const props = defineProps<{ alert: CareAlert }>()

const { respond: respondAlert } = useAlerts()

const responded = ref(props.alert.acknowledged)
const sending = ref(false)

async function respond(action: 'responding' | 'received') {
  sending.value = true
  try {
    // POST /api/alerts/:id/respond —— 'responding' 會讓被照顧者端顯示「家人正在前往」
    // 回覆後同步更新共用的提醒狀態，導覽列紅點與提醒中心會一起變
    await respondAlert(props.alert.id, action)
    responded.value = true
    if (action === 'received') await navigateTo('/caregiver/alerts')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="screen screen--flush screen--nav">
    <AlertBanner
      :tone="alert.kind === 'emergency' ? 'red' : 'yellow'"
      :title="alert.title"
      :message="alert.message"
      :tag="alert.sourceLabel"
    />

    <div class="body-pad">
      <UiCard padding="0" style="overflow: hidden">
        <MapCanvas height="180px" show-flood :markers="[{ x: 52, y: 46, label: '', tone: 'red' }]">
          <div class="live">
            <UiChip tone="plain">{{ alert.location.split(' near')[0] }} · 即時</UiChip>
          </div>
        </MapCanvas>
      </UiCard>

      <InfoCard label="目前位置" :value="alert.location" />
      <InfoCard label="發生時間" :value="alert.time" />
      <InfoCard label="最後移動" :value="alert.lastMovement" />

      <div class="row">
        <UiButton>撥打電話</UiButton>
        <UiButton variant="outline" :to="`/caregiver/members/${alert.memberId}`">
          查看位置
        </UiButton>
      </div>

      <UiButton variant="green" :disabled="sending" @click="respond('responding')">
        <AppIcon v-if="responded" name="check" :size="18" />
        {{ responded ? '已回覆：我正在前往' : '我正在前往' }}
      </UiButton>
      <UiButton variant="ghost" :disabled="sending" @click="respond('received')">
        我知道了
      </UiButton>
    </div>

    <BottomNav />
  </section>
</template>

<style scoped>
.body-pad {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 100px;
}

.live {
  display: grid;
  place-items: center;
  height: 100%;
}
</style>
