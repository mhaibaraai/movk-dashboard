<script setup lang="ts">
const { overview, pending } = useHomeOverview()

const mounted = useMounted()
const loading = computed(() => !mounted.value || pending.value)

interface StatItem {
  key: keyof HomeOverview
  label: string
  icon: string
  to?: string
}

const stats: StatItem[] = [
  { key: 'userCount', label: '用户', icon: 'i-lucide-users', to: '/system/user' },
  { key: 'roleCount', label: '角色', icon: 'i-lucide-shield', to: '/system/role' },
  { key: 'deptCount', label: '部门', icon: 'i-lucide-building-2', to: '/system/dept' },
  { key: 'postCount', label: '岗位', icon: 'i-lucide-briefcase', to: '/system/post' },
  { key: 'fileCount', label: '文件', icon: 'i-lucide-folder', to: '/system/file' },
  { key: 'onlineCount', label: '在线用户', icon: 'i-lucide-wifi', to: '/monitor/online' }
]

function display(value: number | null | undefined): string {
  return value === null || value === undefined ? '-' : String(value)
}
</script>

<template>
  <UPageGrid class="gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    <UPageCard
      v-for="item in stats"
      :key="item.key"
      :to="item.to"
      variant="subtle"
      :ui="{ container: 'p-4 sm:p-4', wrapper: 'flex-row items-center gap-3' }"
    >
      <div class="flex items-center gap-3">
        <div class="flex shrink-0 items-center justify-center rounded-lg bg-primary/10 p-2">
          <UIcon :name="item.icon" class="size-6 text-primary" />
        </div>
        <div class="flex flex-col">
          <span class="text-sm text-muted">{{ item.label }}</span>
          <USkeleton v-if="loading" class="mt-1 h-8 w-12" />
          <span
            v-else
            class="text-3xl font-bold tabular-nums"
            :class="{ 'text-muted font-semibold': overview[item.key] === null || overview[item.key] === undefined }"
          >{{ display(overview[item.key]) }}</span>
        </div>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
