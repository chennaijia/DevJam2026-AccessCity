<script setup lang="ts">
import type { Role } from '#shared/types/accessity'

const { ensureUser, setRole } = useSession()
await ensureUser()

const selected = ref<Role | ''>('')

const options: { value: Role; title: string; desc: string }[] = [
  {
    value: 'care-recipient',
    title: 'Person receiving care',
    desc: 'I want safer, reachable routes for myself.',
  },
  { value: 'caregiver', title: 'Caregiver', desc: 'I look after someone and want safety alerts.' },
]

async function next() {
  if (!selected.value) return
  // TODO: 串接後端 —— PATCH /api/me { role }
  await api.updateRole(selected.value)
  setRole(selected.value)
  await navigateTo(
    selected.value === 'caregiver' ? '/onboarding/family-code' : '/onboarding/needs',
  )
}
</script>

<template>
  <section class="screen">
    <h1 class="brand">Accessity</h1>

    <div>
      <h2 class="title-xl">How will you use Accessity?</h2>
      <p class="body">Pick your role. You can change it later in Profile.</p>
    </div>

    <div class="label">Role</div>

    <div class="stack">
      <UiCard
        v-for="opt in options"
        :key="opt.value"
        :variant="selected === opt.value ? 'active' : 'hard'"
        padding="16px"
        role="radio"
        :aria-checked="selected === opt.value"
        tabindex="0"
        style="cursor: pointer"
        @click="selected = opt.value"
        @keydown.enter="selected = opt.value"
      >
        <div class="row">
          <span class="radio" :class="{ 'radio--on': selected === opt.value }" aria-hidden="true" />
          <div>
            <div class="title-md">{{ opt.title }}</div>
            <div class="muted">{{ opt.desc }}</div>
          </div>
        </div>
      </UiCard>
    </div>

    <UiButton :disabled="!selected" @click="next">Continue</UiButton>

    <p class="muted center">Tap a card to select it. Selection is live in prototype mode.</p>
  </section>
</template>

<style scoped>
.radio {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--line);
  background: var(--surface);
}

.radio--on {
  border-width: 6px;
  border-color: var(--teal);
}
</style>
