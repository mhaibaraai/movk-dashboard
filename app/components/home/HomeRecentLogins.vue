<script setup lang="ts">
import { DICT_TYPE } from '~/constants/dict'

const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'short', timeStyle: 'short' } })
const statusDict = useDict(DICT_TYPE.businessStatus)

const { data, pending } = useApiFetch<PageResp<LoginLogResp>>('/v1/monitor/login-logs', {
  query: { page: 0, size: 4 },
  toast: false
})

const mounted = useMounted()
const loading = computed(() => !mounted.value || pending.value)
const logs = computed(() => data.value?.content ?? [])

// 仅拼接存在的字段，避免出现 "- · 未知" 这类残缺文案
function source(log: LoginLogResp): string {
  return [log.loginIp, log.loginLocation].filter(Boolean).join(' · ') || '未知来源'
}
</script>

<template>
  <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-log-in" class="size-5 text-primary" />
        <span class="font-medium">最近登录</span>
        <ULink to="/monitor/login-log" class="ml-auto text-sm text-muted hover:text-primary">查看全部</ULink>
      </div>
    </template>

    <div v-if="loading" class="flex flex-col gap-3 p-4">
      <USkeleton v-for="i in 4" :key="i" class="h-8 w-full" />
    </div>
    <div v-else-if="!logs.length" class="p-6 text-center text-sm text-muted">
      暂无登录记录
    </div>
    <ul v-else class="divide-y divide-default">
      <li v-for="log in logs" :key="log.id" class="flex items-center gap-3 px-4 py-3">
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-sm font-medium truncate">{{ log.username || '-' }}</span>
          <span class="text-xs text-muted truncate">{{ source(log) }}</span>
        </div>
        <UBadge :color="statusDict.getColor(log.status)" variant="subtle" size="sm">
          {{ statusDict.getLabel(log.status) }}
        </UBadge>
        <span class="text-xs text-muted whitespace-nowrap">{{ formatter.format(formatter.fromISO(log.createdAt)) }}</span>
      </li>
    </ul>
  </UCard>
</template>
