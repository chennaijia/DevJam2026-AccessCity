<script setup lang="ts">
/**
 * 新手流程第一步：選身分。
 * 身分是帳號屬性，所以放在登入之後才問——先前放在登入前，
 * 需要用 cookie 把選擇帶過 OAuth 跳轉，還會讓老帳號回訪時被改掉角色。
 */
import type { Role } from '#shared/types/accessity'

const { user, ensureUser, setRole, needsOnboarding } = useSession()
await ensureUser()

const selected = ref<Role | ''>(user.value?.role ?? '')
// 存檔後 needsOnboarding 會變，先記住進來時是不是新手流程
const wasOnboarding = needsOnboarding.value
const saving = ref(false)

const roles = [
  {
    value: 'care-recipient' as const,
    icon: 'wheelchair' as const,
    title: '我要用它找路',
    desc: '我要找適合自己走的安全路線',
  },
  {
    value: 'caregiver' as const,
    icon: 'shield' as const,
    title: '我要照顧家人',
    desc: '我要照顧家人，需要即時狀態與提醒',
  },
]

async function next() {
  if (!selected.value) return
  saving.value = true
  try {
    await api.updateRole(selected.value)
    setRole(selected.value)

    if (!wasOnboarding) {
      // 從 Profile 進來改身分，改完回 Profile，不要掉進新手流程
      await navigateTo('/profile')
      return
    }

    // 新手流程：被照顧者先設定無障礙需求（之後拿到自己的連結代碼），照顧者直接去輸入代碼
    await navigateTo(selected.value === 'caregiver' ? '/onboarding/connect' : '/onboarding/needs')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="screen welcome">
    <ScreenHeader v-if="!needsOnboarding" title="變更身分" back="/profile" />

    <div class="center">
      <AppLogo :size="64" layout="stack" :text-size="30" />
      <p class="body">
        {{ needsOnboarding ? '歡迎！先告訴我們你要怎麼使用 Accessity。' : '你可以隨時回來調整身分。' }}
      </p>
    </div>

    <div class="stack">
      <UiCard
        v-for="r in roles"
        :key="r.value"
        :variant="selected === r.value ? 'active' : 'soft'"
        padding="20px"
        style="cursor: pointer"
        role="radio"
        :aria-checked="selected === r.value"
        tabindex="0"
        @click="selected = r.value"
        @keydown.enter="selected = r.value"
      >
        <div class="center stack-sm" style="align-items: center">
          <span class="icon" :class="`icon--${r.value}`">
            <AppIcon :name="r.icon" :size="26" />
          </span>
          <div class="title-md">{{ r.title }}</div>
          <div class="muted">{{ r.desc }}</div>
        </div>
      </UiCard>
    </div>

    <UiButton
      :disabled="!selected || saving"
      :variant="selected ? 'primary' : 'ghost'"
      @click="next"
    >
      {{ saving ? '設定中…' : needsOnboarding ? '開始使用' : '儲存' }}
    </UiButton>

    <p class="muted center">身分之後可以在「我的」頁面更改。</p>
  </section>
</template>

<style scoped>
.welcome {
  padding-top: 48px;
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

.icon--caregiver {
  color: #1f3d5c;
}
</style>
