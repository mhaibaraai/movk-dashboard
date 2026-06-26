<script setup lang="ts">
const { currentUser } = useCurrentUser()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'short' } })
const dateFormatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'full' } })

const today = computed(() => dateFormatter.format(dateFormatter.fromISO(new Date().toISOString())))

const displayName = computed(() =>
  currentUser.value?.nickname || currentUser.value?.username || '')

// 按时段问候
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const roleNames = computed(() => currentUser.value?.roles ?? [])

const lastLogin = computed(() => {
  const date = currentUser.value?.loginDate
  return date ? formatter.format(formatter.fromISO(date)) : null
})

const hasMeta = computed(() =>
  Boolean(currentUser.value?.deptName || lastLogin.value || currentUser.value?.loginIp))
</script>

<template>
  <UCard variant="subtle">
    <div class="flex items-center gap-4">
      <UAvatar
        :src="currentUser?.avatar || undefined"
        :alt="displayName"
        size="3xl"
        icon="i-lucide-user"
      />
      <div class="flex flex-col gap-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-lg font-semibold truncate">{{ greeting }}，{{ displayName }}</span>
          <UBadge
            v-for="role in roleNames"
            :key="role"
            color="primary"
            variant="subtle"
            size="sm"
          >
            {{ role }}
          </UBadge>
        </div>
        <div v-if="hasMeta" class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span v-if="currentUser?.deptName" class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-building-2" class="size-4" />
            {{ currentUser.deptName }}
          </span>
          <span v-if="lastLogin" class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-clock" class="size-4" />
            上次登录 {{ lastLogin }}
          </span>
          <span v-if="currentUser?.loginIp" class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-network" class="size-4" />
            {{ currentUser.loginIp }}
          </span>
        </div>
      </div>

      <div class="ml-auto hidden shrink-0 items-center gap-2 text-sm text-muted sm:flex">
        <UIcon name="i-lucide-calendar-days" class="size-4" />
        {{ today }}
      </div>
    </div>
  </UCard>
</template>
