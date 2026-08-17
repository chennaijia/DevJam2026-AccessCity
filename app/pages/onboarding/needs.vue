<script setup lang="ts">
import type { AccessNeed } from '#shared/types/accessity'

const { user, ensureUser, setNeeds, needsOnboarding } = useSession()
await ensureUser()

const options: { value: AccessNeed; title: string; desc: string }[] = [
  { value: 'visual', title: '視覺障礙', desc: '以語音為主的導航與提示音' },
  { value: 'wheelchair', title: '使用輪椅', desc: '無台階路線，優先走斜坡道與電梯' },
  { value: 'mobility', title: '行動不便', desc: '較平坦、沿路有休息點的路線' },
  { value: 'other', title: '其他需求', desc: '之後可以用自己的話告訴 Mimo' },
]

// 編輯時要帶出目前已儲存的需求，不然會看起來像沒設定過
const selected = ref<AccessNeed[]>([...(user.value?.needs ?? [])])

function toggle(value: AccessNeed) {
  selected.value = selected.value.includes(value)
    ? selected.value.filter((v) => v !== value)
    : [...selected.value, value]
}

async function next() {
  // TODO: 串接後端 —— PATCH /api/me { needs }；需求會成為路線規劃的 constraints
  await api.updateNeeds(selected.value)
  setNeeds(selected.value)
  // 新手流程中才往下一步走；從 Profile 進來編輯就回 Profile
  await navigateTo(needsOnboarding.value ? '/onboarding/family-code' : '/profile')
}
</script>

<template>
  <section class="screen">
    <ScreenHeader title="Accessity" :back="needsOnboarding ? '/onboarding/role' : '/profile'" />

    <div>
      <h2 class="title-xl">你的無障礙需求</h2>
      <p class="body">
        符合的都可以勾選。這會決定我們推薦哪些路線，跟你的身分是分開的。
      </p>
    </div>

    <div class="label">無障礙需求</div>

    <div class="stack">
      <UiCard
        v-for="opt in options"
        :key="opt.value"
        padding="16px"
        style="cursor: pointer"
        role="checkbox"
        :aria-checked="selected.includes(opt.value)"
        tabindex="0"
        @click="toggle(opt.value)"
        @keydown.enter="toggle(opt.value)"
      >
        <div class="row">
          <span class="checkbox-box" aria-hidden="true">{{
            selected.includes(opt.value) ? '✓' : ''
          }}</span>
          <div>
            <div class="title-md">{{ opt.title }}</div>
            <div class="muted">{{ opt.desc }}</div>
          </div>
        </div>
      </UiCard>
    </div>

    <UiButton @click="next">下一步</UiButton>
    <UiButton v-if="needsOnboarding" variant="ghost" to="/onboarding/family-code">先跳過</UiButton>
  </section>
</template>
