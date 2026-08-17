<script setup lang="ts">
const { user, ensureUser, logout } = useSession()
await ensureUser()

const needLabels: Record<string, string> = {
  visual: 'Visual impairment',
  wheelchair: 'Wheelchair',
  mobility: 'Mobility assistance',
  other: 'Other',
}

async function signOut() {
  await logout()
  await navigateTo('/login')
}
</script>

<template>
  <section class="screen screen--nav">
    <h1 class="head">Profile</h1>

    <div class="center stack-sm" style="align-items: center">
      <img v-if="user?.avatar" :src="user.avatar" alt="" class="avatar avatar--photo" />
      <span v-else class="avatar">{{ user?.name?.[0] ?? 'K' }}</span>
      <div class="title-lg">{{ user?.name }}</div>
    </div>

    <div class="label">Account</div>
    <UiCard v-if="user?.provider === 'google'" variant="soft" padding="12px 14px">
      <div class="row" style="gap: 8px">
        <AppIcon name="check" :size="16" />
        <span class="muted">已使用 Google 帳號登入</span>
      </div>
    </UiCard>
    <!-- TODO: 串接後端 —— PATCH /api/me（修改姓名 / Email） -->
    <LinkRow label="Name" :value="user?.name ?? '—'" to="/profile" />
    <LinkRow label="Email" :value="user?.email ?? '—'" to="/profile" />

    <div class="label">My Role</div>
    <UiCard variant="active" padding="14px 16px">
      <div class="muted">Current role</div>
      <div class="title-md" style="margin-bottom: 10px">
        {{ user?.role === 'caregiver' ? 'Caregiver' : 'Person receiving care' }}
      </div>
      <UiButton to="/onboarding/role">Change Role</UiButton>
    </UiCard>

    <div class="label">Accessibility Needs</div>
    <UiCard padding="14px 16px">
      <div class="row" style="flex-wrap: wrap">
        <UiChip v-for="n in user?.needs" :key="n" tone="green">{{ needLabels[n] }}</UiChip>
        <span v-if="!user?.needs?.length" class="muted">尚未設定</span>
      </div>
      <UiButton variant="ghost" to="/onboarding/needs" style="margin-top: 10px">
        Edit Accessibility Needs
      </UiButton>
    </UiCard>

    <div class="label">常用地址</div>
    <LinkRow label="Saved addresses" value="Create, Update, Delete" to="/settings/places" />

    <div class="label">Connections</div>
    <LinkRow
      label="Connected caregiver"
      :value="`${user?.connectedCaregiver?.name ?? '未連結'} · ${user?.familyCode ?? ''}`"
      to="/onboarding/connect"
    />
    <LinkRow label="Notification settings" value="Safety & alerts" to="/settings/notifications" />

    <UiButton variant="quiet" @click="signOut">登出</UiButton>

    <BottomNav />
  </section>
</template>

<style scoped>
.head {
  text-align: center;
  color: var(--teal);
  font-size: 20px;
  font-weight: 800;
}

.avatar {
  flex: none;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: var(--green);
  border: 3px solid var(--line);
  display: grid;
  place-items: center;
  font-size: 26px;
  font-weight: 800;
}
</style>
