<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { UBadge } from '#components'
import { LOG_STATUS_COLOR, LOG_STATUS_LABEL, LOG_STATUS_QUERY, LOGIN_TYPE_COLOR, LOGIN_TYPE_LABEL } from '~/constants/monitor'

const { logs, total, pending, query, handleClean, handlePagination, handleSearch } = useLoginLogList()
const { afz } = useAutoForm()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const pagination = useTablePagination(query.value.size ?? 20, handlePagination)

const statusItems = [{ label: '成功', value: 'SUCCESS' }, { label: '失败', value: 'FAILURE' }]

const searchSchema = afz.object({
  username: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-user', label: '用户名' } }).optional(),
  loginIp: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-network', label: '登录 IP' } }).optional(),
  status: afz.enum(['SUCCESS', 'FAILURE'], {
    type: 'selectMenu',
    controlProps: { icon: 'i-lucide-toggle-left', placeholder: '状态', clear: true, valueKey: 'value', items: statusItems }
  }).optional(),
  startTime: afz.calendarDate({ controlProps: { labelFormat: 'iso', placeholder: '开始日期' } })
    .transform(d => formatter.toISO(d)).optional(),
  endTime: afz.calendarDate({ controlProps: { labelFormat: 'iso', placeholder: '结束日期' } })
    .transform(d => formatter.toISO(d)).optional()
})
type LogSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<LogSearch>>({})

function onSearch(event: FormSubmitEvent<LogSearch>) {
  const { status, ...rest } = event.data
  handleSearch({ ...rest, status: status ? LOG_STATUS_QUERY[status] : undefined })
}
function onSearchReset() {
  handleSearch({ username: undefined, loginIp: undefined, status: undefined, startTime: undefined, endTime: undefined })
}

const { download, status: exportStatus } = useDownloadWithProgress()
function onExport() {
  const params = new URLSearchParams()
  const q = query.value
  if (q.username) params.set('username', q.username)
  if (q.loginIp) params.set('loginIp', q.loginIp)
  if (q.status !== undefined) params.set('status', String(q.status))
  if (q.startTime) params.set('startTime', q.startTime)
  if (q.endTime) params.set('endTime', q.endTime)
  const qs = params.toString()
  download(`/v1/monitor/login-logs/export${qs ? `?${qs}` : ''}`, { filename: 'login-logs.xlsx' })
}

const isCleanOpen = ref(false)
const cleanDays = ref(90)
async function onClean() {
  await handleClean(cleanDays.value)
  isCleanOpen.value = false
}

const columns: DataTableColumn<LoginLogResp>[] = [
  { accessorKey: 'username', header: '用户名' },
  {
    accessorKey: 'loginType',
    header: '登录类型',
    cell: ({ row }) => h(
      UBadge,
      { color: LOGIN_TYPE_COLOR[row.original.loginType] ?? 'neutral', variant: 'subtle' },
      () => LOGIN_TYPE_LABEL[row.original.loginType] ?? row.original.loginType
    )
  },
  { accessorKey: 'loginIp', header: '登录 IP' },
  { accessorKey: 'loginLocation', header: '登录地点' },
  { accessorKey: 'browser', header: '浏览器' },
  { accessorKey: 'os', header: '操作系统' },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => h(
      UBadge,
      { color: LOG_STATUS_COLOR[row.original.status] ?? 'neutral', variant: 'subtle' },
      () => LOG_STATUS_LABEL[row.original.status] ?? row.original.status
    )
  },
  { accessorKey: 'message', header: '消息', tooltip: true, size: 160 },
  {
    accessorKey: 'createdAt',
    header: '登录时间',
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.createdAt))
  }
]
</script>

<template>
  <div class="flex flex-col gap-4 min-h-0 flex-1">
    <MSearchForm
      v-model="searchState"
      :schema="searchSchema"
      :global-meta="{ label: '' }"
      :cols="6"
      @submit="onSearch"
      @reset="onSearchReset"
    />

    <AppDataTable
      v-model:pagination="pagination"
      row-key="id"
      :columns="columns"
      :data="logs"
      :loading="pending"
      :pagination-options="{ manualPagination: true, rowCount: total }"
    >
      <template #toolbar-right>
        <UButton icon="i-lucide-trash-2" color="error" variant="soft" @click="isCleanOpen = true">
          清理
        </UButton>
        <UButton icon="i-lucide-download" variant="outline" color="neutral" :loading="exportStatus === 'pending'" @click="onExport">
          导出
        </UButton>
      </template>
    </AppDataTable>

    <UModal v-model:open="isCleanOpen" title="清理登录日志">
      <template #body>
        <div class="flex flex-col gap-2">
          <span class="text-sm text-muted">保留最近天数的日志（最少 7 天）</span>
          <UInputNumber v-model="cleanDays" :min="7" />
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="isCleanOpen = false">
            取消
          </UButton>
          <UButton color="error" @click="onClean">
            确认清理
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
