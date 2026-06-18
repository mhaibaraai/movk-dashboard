<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'

const {
  onlineUsers, total, pending, query,
  handleForceLogout, handleBatchForceLogout, handlePagination, handleSearch
} = useOnlineUserList()
const { afz } = useAutoForm()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const pagination = useTablePagination(query.value.size ?? 20, handlePagination)
const rowSelectionKeys = ref<string[]>([])

const searchSchema = afz.object({
  username: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-user', label: '用户名' } }).optional(),
  loginIp: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-network', label: '登录 IP' } }).optional()
})
type OnlineSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<OnlineSearch>>({})

function onSearch(event: FormSubmitEvent<OnlineSearch>) {
  handleSearch(event.data)
}
function onSearchReset() {
  handleSearch({ username: undefined, loginIp: undefined })
}

async function onBatchForceLogout() {
  await handleBatchForceLogout(rowSelectionKeys.value)
  rowSelectionKeys.value = []
}

const columns: DataTableColumn<OnlineUserResp>[] = [
  { type: 'selection', fixed: 'left', size: 48 },
  { accessorKey: 'username', header: '用户名' },
  { accessorKey: 'clientIp', header: '登录 IP' },
  { accessorKey: 'deviceInfo', header: '设备信息', tooltip: true, size: 200 },
  {
    accessorKey: 'issuedAt',
    header: '登录时间',
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.issuedAt))
  },
  {
    accessorKey: 'lastUsedAt',
    header: '最近活跃',
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.lastUsedAt))
  },
  {
    accessorKey: 'expiresAt',
    header: '过期时间',
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.expiresAt))
  },
  {
    type: 'actions',
    fixed: 'right',
    size: 100,
    actions: [
      {
        key: 'logout',
        buttonProps: { icon: 'i-lucide-log-out', color: 'error', variant: 'ghost', size: 'xs' },
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `强制下线 ${row.username}？`,
          description: '该会话将立即失效，请确认。',
          confirmText: '确认下线'
        }),
        onClick: async ({ row }) => {
          await handleForceLogout(row.id)
        }
      }
    ]
  }
]
</script>

<template>
  <div class="flex flex-col gap-4 min-h-0 flex-1">
    <MSearchForm
      v-model="searchState"
      :schema="searchSchema"
      :global-meta="{ label: '' }"
      :cols="3"
      @submit="onSearch"
      @reset="onSearchReset"
    />

    <AppDataTable
      v-model:pagination="pagination"
      v-model:row-selection-keys="rowSelectionKeys"
      row-key="id"
      :columns="columns"
      :data="onlineUsers"
      :loading="pending"
      :pagination-options="{ manualPagination: true, rowCount: total }"
    >
      <template #toolbar-right>
        <UButton
          v-if="rowSelectionKeys.length > 0"
          icon="i-lucide-log-out"
          color="error"
          variant="soft"
          @click="onBatchForceLogout"
        >
          批量下线（{{ rowSelectionKeys.length }}）
        </UButton>
      </template>
    </AppDataTable>
  </div>
</template>
