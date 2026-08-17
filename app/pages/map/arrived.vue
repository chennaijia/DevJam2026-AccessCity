<script setup lang="ts">
const shared = ref(false)

async function shareStatus() {
  // TODO: 串接後端 —— POST /api/trips/:id/arrive（通知照顧者「已安全抵達」）
  await api.respondAlert('al_arrival', 'received')
  shared.value = true
}
</script>

<template>
  <section class="screen arrived">
    <div class="arrived__hero">
      <span class="sparkle sparkle--a">★</span>
      <span class="sparkle sparkle--b">✦</span>
      <MimoMascot :size="150" />
      <p class="arrived__title">平安抵達</p>
    </div>

    <UiCard variant="soft" padding="14px 16px">
      <div class="row">
        <span class="dot"><AppIcon name="house" :size="20" /></span>
        <div>
          <div class="title-md">社區活動中心</div>
          <div class="row" style="gap: 5px; color: var(--green-strong); font-size: 13px">
            <AppIcon name="check" :size="14" />
            <span>可防洪的避難所</span>
          </div>
        </div>
      </div>
    </UiCard>

    <p class="body center">你已經平安抵達這處輪椅可進出的避難所。</p>

    <UiButton @click="shareStatus">
      <AppIcon :name="shared ? 'check' : 'share'" :size="18" />
      {{ shared ? '已分享給照顧者' : '告訴照顧者我到了' }}
    </UiButton>
    <UiButton variant="outline" to="/shelters">
      <AppIcon name="info" :size="18" />
      避難所資訊
    </UiButton>
    <UiButton variant="quiet" to="/map">
      <NavIcon name="map" />
      回到地圖
    </UiButton>
  </section>
</template>

<style scoped>
.arrived {
  align-items: center;
  padding-top: 40px;
}

.arrived__hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 20px 0;
  background: radial-gradient(circle at 50% 40%, #e4f8e6 0%, rgba(228, 248, 230, 0) 70%);
}

.arrived__title {
  color: var(--teal);
  font-weight: 700;
}

.sparkle {
  position: absolute;
  color: var(--green-strong);
  font-size: 20px;
}

.sparkle--a {
  left: 18%;
  top: 6%;
}

.sparkle--b {
  right: 22%;
  top: 16%;
}

.dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--green);
  color: #0d3a16;
  display: grid;
  place-items: center;
}
</style>
