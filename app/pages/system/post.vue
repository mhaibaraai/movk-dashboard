<script setup lang="ts">
import type { DataTableColumn, PaginationState } from '@movk/nuxt'
import type { FormSubmitEvent, InferInput } from '@nuxt/ui'
import type { z } from 'zod'
import { UBadge } from '#components'
import type { PostCreateReq, PostUpdateReq } from '~/api/system/post'
import { ENABLED_DISABLED_COLOR, ENABLED_DISABLED_LABEL } from '~/constants/system'

const { posts, pending, handleCreate, handleUpdate, handleDelete, getDetail } = usePostList()
const { afz } = useAutoForm()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })

const statusItems = [{ label: '启用', value: 'ENABLED' }, { label: '禁用', value: 'DISABLED' }]

// 顶部搜索（后端无 query 参数，客户端过滤）
const searchSchema = afz.object({
  postCode: afz.string({ controlProps: { placeholder: '岗位编码' } }).optional().meta({ label: '岗位编码' }),
  postName: afz.string({ controlProps: { placeholder: '岗位名称' } }).optional().meta({ label: '岗位名称' }),
  status: afz.enum(['ENABLED', 'DISABLED'], {
    type: 'selectMenu',
    controlProps: { placeholder: '状态', clear: true, valueKey: 'value', items: statusItems }
  }).optional().meta({ label: '状态' })
})
type PostSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<InferInput<typeof searchSchema>>>({})
const appliedSearch = ref<Partial<PostSearch>>({})

function onSearch(event: FormSubmitEvent<PostSearch>) {
  appliedSearch.value = event.data
}
function onSearchReset() {
  appliedSearch.value = {}
}

const filteredPosts = computed(() => {
  const { postCode, postName, status } = appliedSearch.value
  return posts.value.filter((p) => {
    if (postCode && !p.postCode.toLowerCase().includes(postCode.toLowerCase())) return false
    if (postName && !p.postName.toLowerCase().includes(postName.toLowerCase())) return false
    if (status && p.status !== status) return false
    return true
  })
})

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

const columns: DataTableColumn<PostResp>[] = [
  { accessorKey: 'postCode', header: '岗位编码', sortable: true },
  { accessorKey: 'postName', header: '岗位名称', sortable: true },
  { accessorKey: 'orderNum', header: '排序', sortable: true },
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
    sortable: true,
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.createdAt))
  },
  {
    type: 'actions',
    fixed: 'right',
    size: 120,
    actions: [
      {
        key: 'edit',
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'delete',
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
  <div class="flex flex-col gap-4">
    <MSearchForm
      v-model="searchState"
      :schema="searchSchema"
      :cols="4"
      @submit="onSearch"
      @reset="onSearchReset"
    />

    <AppDataTable
      v-model:pagination="pagination"
      row-key="id"
      :columns="columns"
      :data="filteredPosts"
      :loading="pending"
    >
      <template #toolbar-right>
        <UButton icon="i-lucide-plus" @click="openCreate">
          新增岗位
        </UButton>
      </template>
    </AppDataTable>

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
