<script setup lang="ts">
// TODO: 串接後端 —— GET /api/settings/notifications
const { data: settings } = await useAsyncData('notification-settings', () =>
  api.getNotificationSettings(),
)

const form = reactive(structuredClone(toRaw(settings.value!)))

// TODO: 串接後端 —— PATCH /api/settings/notifications（可加 debounce）
watch(form, () => api.updateNotificationSettings(form), { deep: true })
</script>

<template>
  <section class="screen screen--nav">
    <ScreenHeader title="Notifications" back="/caregiver" />

    <h2 class="title-xl">Notification Settings</h2>

    <div class="label">Caregiver</div>
    <ToggleRow
      v-model="form.caregiver.emergencyAlert"
      title="Emergency Alert"
      description="Manual SOS from a family member"
    />
    <ToggleRow
      v-model="form.caregiver.safetyCheckAlert"
      title="Safety Check Alert"
      description="When a member does not respond"
    />
    <ToggleRow
      v-model="form.caregiver.stayDetection"
      title="Stay Detection"
      description="Set per member in Member Detail"
    />
    <ToggleRow
      v-model="form.caregiver.locationNotifications"
      title="Location Notifications"
      description="Arrival and departure updates"
    />

    <div class="label">Person receiving care</div>
    <ToggleRow
      v-model="form.recipient.locationSharing"
      title="Location Sharing"
      description="Shared during trips and alerts"
    />
    <ToggleRow
      v-model="form.recipient.caregiverConnection"
      title="Caregiver Connection"
      description="Allow connected caregiver alerts"
    />
    <ToggleRow
      v-model="form.recipient.safetyCheck"
      title="Safety Check"
      description="Ask if you are okay after long stops"
    />
    <ToggleRow
      v-model="form.recipient.caregiverConnection"
      title="Emergency Contact"
      :description="form.recipient.emergencyContactName"
    />

    <BottomNav />
  </section>
</template>
