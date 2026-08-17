<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
defineProps<{ label?: string }>()
</script>

<template>
  <button
    type="button"
    class="toggle"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    @click="model = !model"
  >
    <span class="toggle__track" :class="{ 'toggle__track--on': model }">
      <span class="toggle__knob" />
    </span>
  </button>
</template>

<style scoped>
.toggle {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
}

.toggle__track {
  display: block;
  width: 58px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: #e9e7e0;
  position: relative;
  transition: background 0.15s ease;
}

.toggle__track--on {
  background: var(--green);
  border-color: #7fd894;
}

.toggle__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(16, 18, 15, 0.25);
  transition: transform 0.15s ease;
}

.toggle__track--on .toggle__knob {
  transform: translateX(26px);
}
</style>
