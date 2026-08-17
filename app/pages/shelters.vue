<script setup lang="ts">
// TODO: 串接後端 —— GET /api/shelters（避難所可達性比較，含淹水/施工影響）
const { data: shelters } = await useAsyncData('shelters', () => api.getShelters())

const explain = ref(false)
</script>

<template>
  <section class="screen screen--flush screen--nav">
    <header class="row-between" style="padding: 12px 16px">
      <button class="icon-btn" aria-label="選單"><AppIcon name="menu" :size="22" /></button>
      <AppLogo :size="26" :text-size="22" />
      <button class="icon-btn" aria-label="通知" @click="navigateTo('/notifications')">
        <AppIcon name="bell" :size="22" />
      </button>
    </header>

    <MapCanvas height="230px" show-flood class="map" :markers="[
      { x: 27, y: 60, label: 'A', tone: 'red' },
      { x: 68, y: 40, label: 'B', tone: 'teal' },
    ]">
      <div class="map__legend">
        <UiChip tone="plain">Ⓐ 河濱避難所 0.8 公里 · 目前不安全</UiChip>
        <UiChip tone="plain">Ⓑ 社區活動中心 2.4 公里 · 安全</UiChip>
      </div>
    </MapCanvas>

    <div class="list">
      <UiCard
        v-for="s in shelters"
        :key="s.id"
        :variant="s.recommended ? 'active' : 'soft'"
        padding="14px 16px"
      >
        <div class="row-between">
          <span class="title-md">{{ s.name }}</span>
          <span class="title-md">{{ s.distanceLabel }}</span>
        </div>

        <div style="margin-top: 8px">
          <UiChip v-if="s.recommended" tone="green-solid">★ 推薦</UiChip>
          <span v-else class="pill-bad"><AppIcon name="warn" :size="15" /> {{ s.headline }}</span>
        </div>

        <p v-if="s.recommended" class="ok">
          <AppIcon name="check" :size="18" />
          {{ s.headline }}
        </p>
        <p v-if="s.note" class="bad">
          <AppIcon name="close" :size="18" />
          {{ s.note }}
        </p>

        <div v-if="s.tags.length" class="row" style="flex-wrap: wrap; margin-top: 10px">
          <UiChip v-for="t in s.tags" :key="t" tone="grey">{{ t }}</UiChip>
        </div>
      </UiCard>

      <UiButton to="/map/routes">前往社區活動中心 →</UiButton>

      <UiButton variant="quiet" @click="explain = !explain">？為什麼推薦這條路線</UiButton>

      <UiCard v-if="explain" variant="soft" padding="14px 16px">
        <!-- TODO: 串接後端 —— GET /api/routes/:id/explain（Navigation Agent 的決策說明） -->
        <p class="body">
          這條路線避開了中山南路的施工與淹水範圍，並且全程有無障礙坡道與可用電梯；雖然多 4
          分鐘，但可達性最高。
        </p>
      </UiCard>
    </div>

    <BottomNav />
  </section>
</template>

<style scoped>
.map {
  border-radius: 0;
}

.map__legend {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  justify-content: space-between;
}

.map__legend :deep(.chip) {
  font-size: 10px;
  padding: 5px 9px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pill-bad {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--red-soft);
  color: var(--red);
  font-weight: 700;
  font-size: 14px;
}

.ok {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--teal);
  font-weight: 800;
  font-size: 17px;
}

.bad {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--red);
  font-weight: 800;
  font-size: 17px;
}

.icon-btn {
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}
</style>
