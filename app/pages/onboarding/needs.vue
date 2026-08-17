<script setup lang="ts">
import type { AccessNeed } from '#shared/types/accessity'

const { ensureUser, setNeeds } = useSession()
await ensureUser()

const options: { value: AccessNeed; title: string; desc: string }[] = [
  { value: 'visual', title: 'Visual impairment', desc: 'Voice-first guidance and audio cues' },
  { value: 'wheelchair', title: 'Wheelchair', desc: 'Step-free routes, ramps and elevators' },
  { value: 'mobility', title: 'Mobility assistance', desc: 'Flatter paths with rest points' },
  { value: 'other', title: 'Other', desc: 'Tell us more in your own words' },
]

const selected = ref<AccessNeed[]>([])

function toggle(value: AccessNeed) {
  selected.value = selected.value.includes(value)
    ? selected.value.filter((v) => v !== value)
    : [...selected.value, value]
}

async function next() {
  // TODO: 串接後端 —— PATCH /api/me { needs }；需求會成為路線規劃的 constraints
  await api.updateNeeds(selected.value)
  setNeeds(selected.value)
  await navigateTo('/onboarding/connect')
}
</script>

<template>
  <section class="screen">
    <ScreenHeader title="Accessity" back="/onboarding/role" />

    <div>
      <h2 class="title-xl">Your accessibility needs</h2>
      <p class="body">
        Select all that apply. This shapes the routes we suggest, separately from your role.
      </p>
    </div>

    <div class="label">Accessibility needs</div>

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

    <UiButton @click="next">Continue</UiButton>
    <UiButton variant="ghost" to="/onboarding/connect">Skip for now</UiButton>
  </section>
</template>
