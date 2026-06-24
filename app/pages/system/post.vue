<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent, InferInput } from '@nuxt/ui'
import type { z } from 'zod'
import { UBadge } from '#components'
import type { PostCreateReq, PostUpdateReq } from '~/api/system/post'
import { ENABLED_DISABLED_COLOR, ENABLED_DISABLED_LABEL } from '~/constants/system'

const {
  posts, total, pending, query,
  handleCreate, handleUpdate, handleDelete, getDetail, handlePagination, handleSearch
} = usePostList()
const { afz } = useAutoForm()
const { hasPermission } = usePermission()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const pagination = useTablePagination(query.value.size ?? 20, handlePagination)

const statusItems = [{ label: '启用', value: 'ENABLED' }, { label: '禁用', value: 'DISABLED' }]

// 顶部搜索（服务端分页过滤）
const searchSchema = afz.object({
  postCode: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-hash', label: '岗位编码' } }).optional(),
  postName: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-briefcase', label: '岗位名称' } }).optional(),
  status: afz.enum(['ENABLED', 'DISABLED'], {
    type: 'selectMenu',
    controlProps: { icon: 'i-lucide-toggle-left', placeholder: '状态', clear: true, valueKey: 'value', items: statusItems }
  }).optional()
})
type PostSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<InferInput<typeof searchSchema>>>({})

function onSearch(event: FormSubmitEvent<PostSearch>) {
  handleSearch(event.data)
}

const isOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = useTemplateRef('formRef')
const state = ref<Partial<PostCreateReq>>({})

const schema = afz.object({
  postCode: afz.string({ controlProps: () => ({ disabled: isEditing.value, placeholder: '请输入岗位编码' }) })
    .max(50, '最多 50 字').meta({ label: '岗位编码' }),
  postName: afz.string({ controlProps: { placeholder: '请输入岗位名称' } })
    .max(50, '最多 50 字').meta({ label: '岗位名称' }),
  orderNum: afz.number().default(0).meta({ label: '排序' }),
  status: afz.enum(['ENABLED', 'DISABLED'], {
    controlProps: { valueKey: 'value', items: statusItems }
  }).default('ENABLED').meta({ label: '状态' }),
  remark: afz.string({ type: 'textarea', controlProps: { rows: 3, placeholder: '备注信息' } })
    .max(500, '最多 500 字').optional().meta({ label: '备注' })
})

type PostSchema = z.output<typeof schema>

function openCreate() {
  isEditing.value = false
  editingId.value = null
  state.value = { status: 'ENABLED', orderNum: 0 }
  isOpen.value = true
}

async function openEdit(id: string) {
  isEditing.value = true
  editingId.value = id
  const detail = await getDetail(id)
  state.value = {
    postCode: detail.postCode,
    postName: detail.postName,
    orderNum: detail.orderNum,
    status: detail.status,
    remark: detail.remark ?? undefined
  }
  isOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<PostSchema>) {
  if (isEditing.value && editingId.value) {
    const { postCode: _postCode, ...rest } = event.data
    await handleUpdate(editingId.value, rest as PostUpdateReq)
  } else {
    await handleCreate(event.data)
  }
  isOpen.value = false
}

// 详情
const isDetailOpen = ref(false)
const detail = ref<PostResp>()
async function openDetail(id: string) {
  detail.value = await getDetail(id)
  isDetailOpen.value = true
}

const detailItems = computed(() => {
  const d = detail.value
  if (!d) return []
  return [
    { label: '岗位编码', key: 'postCode', value: d.postCode },
    { label: '岗位名称', key: 'postName', value: d.postName },
    { label: '排序', key: 'orderNum', value: d.orderNum },
    { label: '状态', key: 'status', value: d.status },
    { label: '备注', key: 'remark', value: d.remark },
    { label: '创建时间', key: 'createdAt', value: formatter.format(formatter.fromISO(d.createdAt)) },
    { label: '更新时间', key: 'updatedAt', value: formatter.format(formatter.fromISO(d.updatedAt)) }
  ]
})

const columns: DataTableColumn<PostResp>[] = [
  { accessorKey: 'postCode', header: '岗位编码' },
  { accessorKey: 'postName', header: '岗位名称' },
  { accessorKey: 'orderNum', header: '排序' },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => h(
      UBadge,
      { color: ENABLED_DISABLED_COLOR[row.original.status] ?? 'neutral', variant: 'subtle' },
      () => ENABLED_DISABLED_LABEL[row.original.status] ?? row.original.status
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
        visibility: hasPermission('system:post:query'),
        buttonProps: { icon: 'i-lucide-eye', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openDetail(row.id)
      },
      {
        key: 'edit',
        visibility: hasPermission('system:post:update'),
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'delete',
        visibility: hasPermission('system:post:delete'),
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除岗位 ${row.postName}？`,
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
      @reset="handleSearch"
    />

    <AppDataTable
      v-model:pagination="pagination"
      row-key="id"
      :columns="columns"
      :data="posts"
      :loading="pending"
      :pagination-options="{ manualPagination: true, rowCount: total }"
    >
      <template #toolbar-right>
        <UButton v-permission="'system:post:create'" icon="i-lucide-plus" @click="openCreate">
          新增岗位
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isDetailOpen" title="岗位详情" class="w-120">
      <template #body>
        <AppDescriptions v-if="detail" :items="detailItems">
          <template #status>
            <UBadge :color="ENABLED_DISABLED_COLOR[detail?.status ?? ''] ?? 'neutral'" variant="subtle">
              {{ ENABLED_DISABLED_LABEL[detail?.status ?? ''] ?? detail?.status }}
            </UBadge>
          </template>
        </AppDescriptions>
      </template>
    </USlideover>

    <USlideover v-model:open="isOpen" :title="isEditing ? '编辑岗位' : '新增岗位'" class="w-120">
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
