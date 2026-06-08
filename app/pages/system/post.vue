<script setup lang="ts">
import type { DataTableColumn, PaginationState } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import { UBadge } from '#components'
import type { PostCreateReq, PostUpdateReq } from '~/api/system/post'
import { ENABLED_DISABLED_COLOR, ENABLED_DISABLED_LABEL } from '~/constants/system'

const { posts, pending, handleCreate, handleUpdate, handleDelete, getDetail } = usePostList()
const { afz } = useAutoForm()
const toast = useToast()

const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })

const isOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = useTemplateRef('formRef')
const state = reactive<Partial<PostCreateReq>>({})

function blankPostForm(): Partial<PostCreateReq> {
  return { postCode: undefined, postName: undefined, orderNum: undefined, status: undefined, remark: undefined }
}

function resetState(value: Partial<PostCreateReq> = {}) {
  Object.assign(state, blankPostForm(), value)
}

const schema = computed(() => afz.object({
  postCode: afz.string({ controlProps: { disabled: isEditing.value, placeholder: '请输入岗位编码' } })
    .max(50, '最多 50 字').meta({ label: '岗位编码' }),
  postName: afz.string({ controlProps: { placeholder: '请输入岗位名称' } })
    .max(50, '最多 50 字').meta({ label: '岗位名称' }),
  orderNum: afz.number().default(0).meta({ label: '排序' }),
  status: afz.enum(['ENABLED', 'DISABLED'], {
    controlProps: { valueKey: 'value', items: [{ label: '启用', value: 'ENABLED' }, { label: '禁用', value: 'DISABLED' }] }
  }).default('ENABLED').meta({ label: '状态' }),
  remark: afz.string({ type: 'textarea', controlProps: { rows: 3, placeholder: '备注信息' } })
    .max(500, '最多 500 字').optional().meta({ label: '备注' })
}))

function openCreate() {
  isEditing.value = false
  editingId.value = null
  resetState({ status: 'ENABLED', orderNum: 0 })
  isOpen.value = true
}

async function openEdit(id: string) {
  isEditing.value = true
  editingId.value = id
  const detail = await getDetail(id)
  resetState({
    postCode: detail.postCode,
    postName: detail.postName,
    orderNum: detail.orderNum,
    status: detail.status,
    remark: detail.remark ?? undefined
  })
  isOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<PostCreateReq>) {
  if (isEditing.value && editingId.value) {
    const { postCode: _postCode, ...rest } = event.data
    await handleUpdate(editingId.value, rest as PostUpdateReq)
    toast.add({ title: '修改成功', color: 'success' })
  } else {
    await handleCreate(event.data)
    toast.add({ title: '新增成功', color: 'success' })
  }
  isOpen.value = false
}

const columns: DataTableColumn<PostResp>[] = [
  { accessorKey: 'postCode', header: '岗位编码', size: 160 },
  { accessorKey: 'postName', header: '岗位名称', size: 160 },
  { accessorKey: 'orderNum', header: '排序', size: 80 },
  {
    accessorKey: 'status',
    header: '状态',
    size: 100,
    cell: ({ row }) => h(
      UBadge,
      { color: ENABLED_DISABLED_COLOR[row.original.status] ?? 'neutral', variant: 'subtle' },
      () => ENABLED_DISABLED_LABEL[row.original.status] ?? row.original.status
    )
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    size: 160,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('zh-CN')
  },
  {
    type: 'actions',
    size: 120,
    actions: [
      {
        key: 'edit',
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'delete',
        buttonProps: { icon: 'i-lucide-trash-2', label: '删除', color: 'error', variant: 'ghost', size: 'xs' },
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除岗位 ${row.postName}？`,
          description: '删除后无法恢复，请确认。',
          confirmText: '确认删除'
        }),
        onClick: async ({ row }) => {
          await handleDelete(row.id)
          toast.add({ title: '删除成功', color: 'success' })
        }
      }
    ]
  }
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-end">
      <UButton icon="i-lucide-plus" @click="openCreate">
        新增岗位
      </UButton>
    </div>

    <MDataTable
      v-model:pagination="pagination"
      row-key="id"
      :columns="columns"
      :data="posts"
      :loading="pending"
    />

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
