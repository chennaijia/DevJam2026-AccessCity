<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
withDefaults(
  defineProps<{ tone?: 'red' | 'yellow' | 'teal'; title: string; message?: string }>(),
  { tone: 'teal' },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal" role="dialog" aria-modal="true">
      <div class="modal__backdrop" @click="open = false" />
      <div class="modal__panel">
        <div class="modal__icon" :class="`modal__icon--${tone}`" aria-hidden="true">!</div>
        <h2 class="title-lg center">{{ title }}</h2>
        <p v-if="message" class="body center">{{ message }}</p>
        <div class="modal__actions">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 24px;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(16, 18, 15, 0.45);
}

.modal__panel {
  position: relative;
  width: 100%;
  max-width: 340px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.modal__icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 30px;
  font-weight: 900;
}

.modal__icon--red {
  background: var(--red);
}

.modal__icon--yellow {
  background: var(--yellow);
  color: #10120f;
}

.modal__icon--teal {
  background: var(--teal);
}

.modal__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}
</style>
