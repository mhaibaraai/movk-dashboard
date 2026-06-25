<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { Tree } from '@movk/core'
import { UBadge } from '#components'
import type { DeptCreateReq, DeptUpdateReq } from '~/api/system/dept'
import { DICT_TYPE } from '~/constants/dict'

const { tree, pending, handleCreate, handleUpdate, handleDelete, getDetail } = useDeptTree()
const { userOptions } = useUserOptions()
const { afz } = useAutoForm()
const { hasPermission } = usePermission()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const statusDict = useDict(DICT_TYPE.normalDisable)
const deptOptions = computed(() => Tree.toList(tree.value).map(d => ({ label: d.deptName, value: d.id })))

const isOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = useTemplateRef('formRef')
const state = ref<Partial<DeptCreateReq>>({})

const schema = afz.object({
  parentId: afz.enum([], {
    type: 'selectMenu',
    controlProps: () => ({ placeholder: '上级部门（留空为顶级）', clear: true, valueKey: 'value', items: deptOptions.value })
  }).optional().meta({ label: '上级部门' }),
  deptName: afz.string({ controlProps: { placeholder: '请输入部门名称' } })
    .max(50, '最多 50 字').meta({ label: '部门名称' }),
  deptCode: afz.string({ controlProps: { placeholder: '请输入部门编码' } })
    .max(50, '最多 50 字').optional().meta({ label: '部门编码' }),
  orderNum: afz.number().default(0).meta({ label: '排序' }),
  leaderUserId: afz.enum([], {
    type: 'selectMenu',
    controlProps: () => ({ placeholder: '请选择负责人', clear: true, valueKey: 'value', items: userOptions.value })
  }).optional().meta({ label: '负责人' }),
  phone: afz.string({ controlProps: { placeholder: '请输入联系电话' } }).optional().meta({ label: '联系电话' }),
  email: afz.email({ type: 'string', controlProps: { placeholder: '请输入邮箱' } }).optional().meta({ label: '邮箱' }),
  status: afz.enum([], {
    type: 'selectMenu',
    controlProps: () => ({ valueKey: 'value', items: statusDict.options.value })
  }).meta({ label: '状态' })
})
type DeptSchema = z.output<typeof schema>

function openCreate(parentId?: string) {
  isEditing.value = false
  editingId.value = null
  state.value = { status: statusDict.defaultValue.value, orderNum: 0, parentId }
  isOpen.value = true
}

async function openEdit(id: string) {
  isEditing.value = true
  editingId.value = id
  const detail = await getDetail(id)
  state.value = {
    parentId: detail.parentId ?? undefined,
    deptName: detail.deptName,
    deptCode: detail.deptCode ?? undefined,
    orderNum: detail.orderNum,
    leaderUserId: detail.leaderUserId ?? undefined,
    phone: detail.phone ?? undefined,
    email: detail.email ?? undefined,
    status: detail.status
  }
  isOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<DeptSchema>) {
  if (isEditing.value && editingId.value) {
    await handleUpdate(editingId.value, event.data as DeptUpdateReq)
  } else {
    await handleCreate(event.data)
  }
  isOpen.value = false
}

// 详情
const isDetailOpen = ref(false)
const detail = ref<DeptResp>()
async function openDetail(id: string) {
  detail.value = await getDetail(id)
  isDetailOpen.value = true
}

const detailItems = computed(() => {
  const d = detail.value
  if (!d) return []
  return [
    { label: '部门名称', key: 'deptName', value: d.deptName },
    { label: '部门编码', key: 'deptCode', value: d.deptCode },
    { label: '负责人', key: 'leaderUserName', value: d.leaderUserName },
    { label: '联系电话', key: 'phone', value: d.phone },
    { label: '邮箱', key: 'email', value: d.email },
    { label: '排序', key: 'orderNum', value: d.orderNum },
    { label: '状态', key: 'status', value: d.status },
    { label: '创建时间', key: 'createdAt', value: formatter.format(formatter.fromISO(d.createdAt)) },
    { label: '更新时间', key: 'updatedAt', value: formatter.format(formatter.fromISO(d.updatedAt)) }
  ]
})

const columns: DataTableColumn<DeptResp>[] = [
  { type: 'expand' },
  { accessorKey: 'deptName', header: '部门名称' },
  { accessorKey: 'deptCode', header: '部门编码' },
  { accessorKey: 'leaderUserName', header: '负责人' },
  { accessorKey: 'phone', header: '联系电话' },
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
    sortable: true,
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.createdAt))
  },
  {
    type: 'actions',
    fixed: 'right',
    size: 150,
    maxInline: 4,
    actions: [
      {
        key: 'detail',
        visibility: hasPermission('system:dept:query'),
        buttonProps: { icon: 'i-lucide-eye', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openDetail(row.id)
      },
      {
        key: 'addChild',
        visibility: hasPermission('system:dept:create'),
        buttonProps: { icon: 'i-lucide-plus', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openCreate(row.id)
      },
      {
        key: 'edit',
        visibility: hasPermission('system:dept:update'),
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'delete',
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        visibility: ({ row }) => hasPermission('system:dept:delete') && !(row.children && row.children.length),
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除部门 ${row.deptName}？`,
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
    <AppDataTable
      children-key="children"
      row-key="id"
      :columns="columns"
      :data="tree"
      :loading="pending"
      default-expanded
      :pagination-ui="{ show: false }"
    >
      <template #toolbar-right>
        <UButton v-permission="'system:dept:create'" icon="i-lucide-plus" @click="openCreate()">
          新增部门
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isDetailOpen" title="部门详情" class="w-120">
      <template #body>
        <AppDescriptions v-if="detail" :items="detailItems">
          <template #status>
            <UBadge :color="statusDict.getColor(detail?.status)" variant="subtle">
              {{ statusDict.getLabel(detail?.status) }}
            </UBadge>
          </template>
        </AppDescriptions>
      </template>
    </USlideover>

    <USlideover v-model:open="isOpen" :title="isEditing ? '编辑部门' : '新增部门'" class="w-120">
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
