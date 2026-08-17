<script setup lang="ts">
import type { CareAlert } from '#shared/types/accessity'

const props = defineProps<{ alert: CareAlert }>()

const responded = ref(false)

async function respond(action: 'responding' | 'received') {
  // TODO: 串接後端 —— POST /api/alerts/:id/respond { action }
  //       'responding' 會讓被照顧者端顯示「家人正在前往」
  await api.respondAlert(props.alert.id, action)
  responded.value = true
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
            <UiChip tone="plain">{{ alert.location.split(' near')[0] }} · Live</UiChip>
          </div>
        </MapCanvas>
      </UiCard>

      <InfoCard label="Current Location" :value="alert.location" />
      <InfoCard label="Time" :value="alert.time" />
      <InfoCard label="Last Movement" :value="alert.lastMovement" />

      <div class="row">
        <UiButton>Call</UiButton>
        <UiButton variant="outline" to="/caregiver">View Location</UiButton>
      </div>

      <UiButton variant="green" @click="respond('responding')">
        {{ responded ? '✓ 已回覆：我正在前往' : "I'm Responding" }}
      </UiButton>
      <UiButton variant="ghost" @click="respond('received')">Confirm Received</UiButton>
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
