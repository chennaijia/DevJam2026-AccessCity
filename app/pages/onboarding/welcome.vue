<script setup lang="ts">
/** App 第一頁：選擇身分（Navigator / Caregiver / Others），接著才是登入 */
const { pendingRole } = useSession()

const selected = ref('')

const roles = [
  {
    key: 'navigator',
    icon: 'wheelchair',
    title: 'I am a Navigator',
    desc: 'Find reachable safe paths.',
  },
  {
    key: 'caregiver',
    icon: 'shield',
    title: 'I am a Caregiver',
    desc: 'Monitor safety and track progress.',
  },
  { key: 'others', icon: 'shield', title: 'Others', desc: '~~' },
] as const

async function start() {
  if (!selected.value) return
  // 身分先記在 session，登入成功後才寫回帳號（PATCH /api/me）
  pendingRole.value = selected.value === 'caregiver' ? 'caregiver' : 'care-recipient'
  await navigateTo('/login')
}
</script>

<template>
  <section class="screen welcome">
    <div class="center">
      <h1 class="brand" style="font-size: 30px">Accessity</h1>
      <p class="body">Welcome. Please select your role to customize your experience.</p>
    </div>

    <div class="stack">
      <UiCard
        v-for="r in roles"
        :key="r.key"
        :variant="selected === r.key ? 'active' : 'soft'"
        padding="20px"
        style="cursor: pointer"
        role="radio"
        :aria-checked="selected === r.key"
        tabindex="0"
        @click="selected = r.key"
        @keydown.enter="selected = r.key"
      >
        <div class="center stack-sm" style="align-items: center">
          <span class="icon" :class="`icon--${r.key}`">
            <AppIcon :name="r.icon" :size="26" />
          </span>
          <div class="title-md">{{ r.title }}</div>
          <div class="muted">{{ r.desc }}</div>
        </div>
      </UiCard>
    </div>

    <UiButton :disabled="!selected" :variant="selected ? 'primary' : 'ghost'" @click="start">
      Get Started
    </UiButton>
  </section>
</template>

<style scoped>
.welcome {
  padding-top: 40px;
  gap: 18px;
}

.icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #eceff0;
  display: grid;
  place-items: center;
  color: var(--teal);
}

.icon--caregiver,
.icon--others {
  color: #1f3d5c;
}
</style>
