<script setup lang="ts">
import type { DataTableColumn, PaginationState } from '@movk/nuxt'
import type { FormSubmitEvent, InferInput } from '@nuxt/ui'
import type { z } from 'zod'
import { UBadge } from '#components'
import type { NoticeCreateReq, NoticeUpdateReq } from '~/api/system/notice'
import { DICT_TYPE } from '~/constants/dict'

const { notices, pending, handleCreate, handleUpdate, handleDelete, handleDeleteBatch, getDetail } = useNoticeList()
const { afz } = useAutoForm()
const { hasPermission } = usePermission()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })
const rowSelectionKeys = ref<string[]>([])

const typeDict = useDict(DICT_TYPE.noticeType)
const statusDict = useDict(DICT_TYPE.normalDisable)

// 顶部搜索（后端无业务 query，客户端过滤）
const searchSchema = afz.object({
  noticeTitle: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-megaphone', label: '公告标题' } }).optional(),
  noticeType: afz.enum([], {
    type: 'selectMenu',
    controlProps: () => ({ icon: 'i-lucide-tag', placeholder: '类型', clear: true, valueKey: 'value', items: typeDict.options.value })
  }).optional(),
  status: afz.enum([], {
    type: 'selectMenu',
    controlProps: () => ({ icon: 'i-lucide-toggle-left', placeholder: '状态', clear: true, valueKey: 'value', items: statusDict.options.value })
  }).optional()
})
type NoticeSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<InferInput<typeof searchSchema>>>({})
const appliedSearch = ref<Partial<NoticeSearch>>({})

function onSearch(event: FormSubmitEvent<NoticeSearch>) {
  appliedSearch.value = event.data
}
function onSearchReset() {
  appliedSearch.value = {}
}

const filteredNotices = computed(() => {
  const { noticeTitle, noticeType, status } = appliedSearch.value
  return notices.value.filter((n) => {
    if (noticeTitle && !n.noticeTitle.toLowerCase().includes(noticeTitle.toLowerCase())) return false
    if (noticeType && n.noticeType !== noticeType) return false
    if (status && n.status !== status) return false
    return true
  })
})

const isOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = useTemplateRef('formRef')
const state = ref<Partial<NoticeCreateReq>>({})

const schema = afz.object({
  noticeTitle: afz.string({ controlProps: { placeholder: '请输入公告标题' } })
    .min(1, '请输入公告标题').max(100, '最多 100 字').meta({ label: '公告标题' }),
  noticeType: afz.enum([], { type: 'selectMenu', controlProps: () => ({ valueKey: 'value', items: typeDict.options.value }) })
    .meta({ label: '类型' }),
  status: afz.enum([], { type: 'selectMenu', controlProps: () => ({ valueKey: 'value', items: statusDict.options.value }) })
    .meta({ label: '状态' }),
  noticeContent: afz.string({ type: 'textarea', controlProps: { rows: 8, placeholder: '请输入公告内容' } })
    .max(10000, '最多 10000 字').optional().meta({ label: '内容' })
})
type NoticeSchema = z.output<typeof schema>

function openCreate() {
  isEditing.value = false
  editingId.value = null
  state.value = { noticeType: typeDict.defaultValue.value, status: statusDict.defaultValue.value }
  isOpen.value = true
}
async function openEdit(id: string) {
  isEditing.value = true
  editingId.value = id
  const detail = await getDetail(id)
  state.value = {
    noticeTitle: detail.noticeTitle,
    noticeType: detail.noticeType,
    status: detail.status,
    noticeContent: detail.noticeContent ?? undefined
  }
  isOpen.value = true
}
async function onSubmit(event: FormSubmitEvent<NoticeSchema>) {
  if (isEditing.value && editingId.value) {
    await handleUpdate(editingId.value, event.data as NoticeUpdateReq)
  } else {
    await handleCreate(event.data)
  }
  isOpen.value = false
}

async function onBatchDelete() {
  await handleDeleteBatch(rowSelectionKeys.value)
  rowSelectionKeys.value = []
}

// 详情
const isDetailOpen = ref(false)
const detail = ref<NoticeResp>()
async function openDetail(id: string) {
  detail.value = await getDetail(id)
  isDetailOpen.value = true
}

const detailItems = computed(() => {
  const d = detail.value
  if (!d) return []
  return [
    { label: '公告标题', key: 'noticeTitle', value: d.noticeTitle },
    { label: '类型', key: 'noticeType', value: d.noticeType },
    { label: '状态', key: 'status', value: d.status },
    { label: '创建人', key: 'creator', value: d.creator },
    { label: '内容', key: 'noticeContent', value: d.noticeContent },
    { label: '创建时间', key: 'createdAt', value: formatter.format(formatter.fromISO(d.createdAt)) },
    { label: '更新时间', key: 'updatedAt', value: formatter.format(formatter.fromISO(d.updatedAt)) }
  ]
})

const columns: DataTableColumn<NoticeResp>[] = [
  { type: 'selection', fixed: 'left', size: 48 },
  { accessorKey: 'noticeTitle', header: '公告标题', tooltip: true, size: 280 },
  {
    accessorKey: 'noticeType',
    header: '类型',
    cell: ({ row }) => h(
      UBadge,
      { color: typeDict.getColor(row.original.noticeType), variant: 'subtle' },
      () => typeDict.getLabel(row.original.noticeType)
    )
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
    header: '创建时间',
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.createdAt))
  },
  {
    type: 'actions',
    fixed: 'right',
    size: 150,
    maxInline: 3,
    actions: [
      {
        key: 'detail',
        visibility: hasPermission('system:notice:query'),
        buttonProps: { icon: 'i-lucide-eye', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openDetail(row.id)
      },
      {
        key: 'edit',
        visibility: hasPermission('system:notice:update'),
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'delete',
        visibility: hasPermission('system:notice:delete'),
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除公告 ${row.noticeTitle}？`,
          description: '删除后无法恢复，请确认。',
          confirmText: '确认删除'
        }),
        onClick: async ({ row }) => {
          await handleDelete(row.id)
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
      :cols="4"
      @submit="onSearch"
      @reset="onSearchReset"
    />

    <AppDataTable
      v-model:pagination="pagination"
      v-model:row-selection-keys="rowSelectionKeys"
      row-key="id"
      :columns="columns"
      :data="filteredNotices"
      :loading="pending"
    >
      <template #toolbar-right>
        <UButton
          v-if="rowSelectionKeys.length > 0"
          v-permission="'system:notice:delete'"
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          @click="onBatchDelete"
        >
          批量删除（{{ rowSelectionKeys.length }}）
        </UButton>
        <UButton v-permission="'system:notice:create'" icon="i-lucide-plus" @click="openCreate">
          新增公告
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isDetailOpen" title="公告详情" class="w-150">
      <template #body>
        <AppDescriptions v-if="detail" :items="detailItems">
          <template #noticeType>
            <UBadge :color="typeDict.getColor(detail?.noticeType)" variant="subtle">
              {{ typeDict.getLabel(detail?.noticeType) }}
            </UBadge>
          </template>
          <template #status>
            <UBadge :color="statusDict.getColor(detail?.status)" variant="subtle">
              {{ statusDict.getLabel(detail?.status) }}
            </UBadge>
          </template>
        </AppDescriptions>
      </template>
    </USlideover>

    <USlideover v-model:open="isOpen" :title="isEditing ? '编辑公告' : '新增公告'" class="w-150">
      <template #body>
        <MAutoForm
          ref="formRef"
          :schema="schema"
          :state="state"
          :submit="false"
          @submit="onSubmit"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="isOpen = false">
            取消
          </UButton>
          <UButton @click="formRef?.formRef?.submit()">
            保存
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
