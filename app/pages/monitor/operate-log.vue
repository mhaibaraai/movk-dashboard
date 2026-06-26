<script setup lang="ts">
import { UBadge } from '#components'
import { omitUndefined } from '@movk/core'
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import { withQuery } from 'ufo'
import type { z } from 'zod'
import { DICT_TYPE, LOG_STATUS_QUERY } from '~/constants/dict'

const { logs, total, pending, query, handleClean, getDetail, handlePagination, handleSearch } = useOperateLogList()
const { afz } = useAutoForm()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const pagination = useTablePagination(query.value.size ?? 20, handlePagination)

const statusDict = useDict(DICT_TYPE.businessStatus)

const searchSchema = afz.object({
  module: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-package', label: '模块' } }).optional(),
  operation: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-mouse-pointer-click', label: '操作' } }).optional(),
  status: afz.enum([], {
    type: 'selectMenu',
    controlProps: () => ({ icon: 'i-lucide-toggle-left', placeholder: '状态', clear: true, valueKey: 'value', items: statusDict.options.value })
  }).optional(),
  dateRange: afz.calendarDate({
    controlProps: {
      range: true,
      labelFormat: 'date',
      valueFormat: 'iso',
      icon: 'i-lucide-calendar',
      placeholder: '日期范围',
      presets: 'default'
    }
  }).optional()
})
type LogSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<LogSearch>>({})

function onSearch(event: FormSubmitEvent<LogSearch>) {
  const { status, dateRange, ...rest } = event.data
  handleSearch({
    ...rest,
    status: status ? LOG_STATUS_QUERY[status] : undefined,
    startTime: dateRange?.start ?? undefined,
    endTime: dateRange?.end ?? undefined
  })
}
function onSearchReset() {
  handleSearch({ module: undefined, operation: undefined, status: undefined, startTime: undefined, endTime: undefined })
}

// 导出（携带当前筛选）
const { download, status: exportStatus } = useDownloadWithProgress()
function onExport() {
  const { module, operation, status, startTime, endTime } = query.value
  download(
    withQuery('/v1/monitor/operate-logs/export', omitUndefined({ module, operation, status, startTime, endTime })),
    { filename: 'operate-logs.xlsx' }
  )
}

// 清理
const isCleanOpen = ref(false)
const cleanDays = ref(30)
async function onClean() {
  await handleClean(cleanDays.value)
  isCleanOpen.value = false
}

// 详情
const isDetailOpen = ref(false)
const detail = ref<OperateLogResp>()
async function openDetail(id: number) {
  detail.value = await getDetail(id)
  isDetailOpen.value = true
}

const columns: DataTableColumn<OperateLogResp>[] = [
  { accessorKey: 'module', header: '模块' },
  { accessorKey: 'operation', header: '操作' },
  { accessorKey: 'username', header: '操作人' },
  { accessorKey: 'userIp', header: 'IP' },
  { accessorKey: 'requestMethod', header: '请求方式' },
  {
    accessorKey: 'operationTime',
    header: '耗时(ms)',
    cell: ({ row }) => row.original.operationTime ?? '-'
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => h(
      UBadge,
      { color: statusDict.getColor(row.original.status), variant: 'subtle' },
      () => statusDict.getLabel(row.original.status)
    )
  },
  {
    accessorKey: 'createdAt',
    header: '操作时间',
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.createdAt))
  },
  {
    type: 'actions',
    fixed: 'right',
    size: 60,
    actions: [
      {
        key: 'detail',
        buttonProps: { icon: 'i-lucide-eye', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openDetail(row.id)
      }
    ]
  }
]

const detailFields: { label: string, key: keyof OperateLogResp }[] = [
  { label: '链路 ID', key: 'traceId' },
  { label: '模块', key: 'module' },
  { label: '操作', key: 'operation' },
  { label: '方法', key: 'method' },
  { label: '请求方式', key: 'requestMethod' },
  { label: '请求地址', key: 'requestUrl' },
  { label: '请求参数', key: 'requestParams' },
  { label: '请求体', key: 'requestBody' },
  { label: '响应数据', key: 'responseData' },
  { label: '错误信息', key: 'errorMsg' },
  { label: 'User-Agent', key: 'userAgent' }
]
</script>

<template>
  <div class="flex flex-col gap-4 min-h-0 flex-1">
    <MSearchForm
      v-model="searchState"
      :schema="searchSchema"
      :global-meta="{ label: '' }"
      :cols="5"
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
        <UButton v-permission="'monitor:operateLog:delete'" icon="i-lucide-trash-2" color="error" variant="soft" @click="isCleanOpen = true">
          清理
        </UButton>
        <UButton icon="i-lucide-download" variant="outline" color="neutral" :loading="exportStatus === 'pending'" @click="onExport">
          导出
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isDetailOpen" title="操作日志详情" class="w-150">
      <template #body>
        <div v-if="detail" class="flex flex-col gap-3 text-sm">
          <div v-for="field in detailFields" :key="field.key" class="flex flex-col gap-1">
            <span class="text-muted">{{ field.label }}</span>
            <pre class="whitespace-pre-wrap break-all rounded-md bg-elevated p-2">{{ detail[field.key] ?? '-' }}</pre>
          </div>
        </div>
      </template>
    </USlideover>

    <UModal v-model:open="isCleanOpen" title="清理操作日志">
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
