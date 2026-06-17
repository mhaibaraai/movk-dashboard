<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent, InferInput } from '@nuxt/ui'
import type { z } from 'zod'
import { Tree } from '@movk/core'
import { UBadge } from '#components'
import type { RoleCreateReq, RoleUpdateReq } from '~/api/system/role'
import { ENABLED_DISABLED_COLOR, ENABLED_DISABLED_LABEL } from '~/constants/system'

const {
  roles, total, pending, query,
  handleCreate, handleUpdate, handleDelete, handleDeleteBatch,
  getDetail, handleAssignMenus, handleSearch, handlePagination
} = useRoleList()

const { afz } = useAutoForm()
const { deptOptions } = useUserFormOptions()
const { tree: menuTree } = useMenuTree()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const pagination = useTablePagination(query.value.size ?? 20, handlePagination)
const rowSelectionKeys = ref<string[]>([])

const statusItems = [{ label: '启用', value: 'ENABLED' }, { label: '禁用', value: 'DISABLED' }]
const roleTypeItems = [{ label: '内置', value: 'BUILT_IN' }, { label: '自定义', value: 'CUSTOM' }]
const dataScopeItems = [
  { label: '全部数据', value: 'ALL' },
  { label: '本部门', value: 'DEPT' },
  { label: '本部门及子部门', value: 'DEPT_AND_CHILD' },
  { label: '仅本人', value: 'SELF' },
  { label: '自定义部门', value: 'CUSTOM' }
]

// 搜索（服务端 query）
const searchSchema = afz.object({
  code: afz.string({ controlProps: { placeholder: '角色编码' } }).optional().meta({ label: '角色编码' }),
  name: afz.string({ controlProps: { placeholder: '角色名称' } }).optional().meta({ label: '角色名称' }),
  status: afz.enum(['ENABLED', 'DISABLED'], {
    type: 'selectMenu',
    controlProps: { placeholder: '状态', clear: true, valueKey: 'value', items: statusItems }
  }).optional().meta({ label: '状态' }),
  roleType: afz.enum(['BUILT_IN', 'CUSTOM'], {
    type: 'selectMenu',
    controlProps: { placeholder: '类型', clear: true, valueKey: 'value', items: roleTypeItems }
  }).optional().meta({ label: '类型' })
})
type RoleSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<InferInput<typeof searchSchema>>>({})

function onSearch(event: FormSubmitEvent<RoleSearch>) {
  handleSearch(event.data)
}
function onSearchReset() {
  handleSearch({})
}

// 新增 / 编辑
const isOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = useTemplateRef('formRef')
const state = ref<Partial<RoleCreateReq>>({})

const schema = afz.object({
  code: afz.string({ controlProps: () => ({ disabled: isEditing.value, placeholder: '请输入角色编码' }) })
    .max(50, '最多 50 字').meta({ label: '角色编码' }),
  name: afz.string({ controlProps: { placeholder: '请输入角色名称' } })
    .max(50, '最多 50 字').meta({ label: '角色名称' }),
  roleSort: afz.number().default(0).meta({ label: '排序' }),
  dataScope: afz.enum(['ALL', 'DEPT', 'DEPT_AND_CHILD', 'SELF', 'CUSTOM'], {
    type: 'selectMenu',
    controlProps: { valueKey: 'value', items: dataScopeItems }
  }).default('ALL').meta({ label: '数据范围' }),
  dataScopeDeptIds: afz.array(afz.string(), {
    type: 'selectMenu',
    controlProps: () => ({ multiple: true, placeholder: '请选择部门', valueKey: 'value', items: deptOptions.value })
  }).default([]).meta({ label: '自定义部门', if: ({ state }: { state: Partial<RoleCreateReq> }) => state.dataScope === 'CUSTOM' }),
  status: afz.enum(['ENABLED', 'DISABLED'], {
    controlProps: { valueKey: 'value', items: statusItems }
  }).default('ENABLED').meta({ label: '状态' }),
  remark: afz.string({ type: 'textarea', controlProps: { rows: 3, placeholder: '备注信息' } })
    .max(500, '最多 500 字').optional().meta({ label: '备注' })
})
type RoleSchema = z.output<typeof schema>

function openCreate() {
  isEditing.value = false
  editingId.value = null
  state.value = { status: 'ENABLED', roleSort: 0, dataScope: 'ALL' }
  isOpen.value = true
}

async function openEdit(id: string) {
  isEditing.value = true
  editingId.value = id
  const detail = await getDetail(id)
  state.value = {
    code: detail.code,
    name: detail.name,
    roleSort: detail.roleSort,
    dataScope: detail.dataScope,
    dataScopeDeptIds: detail.dataScopeDeptIds,
    status: detail.status,
    remark: detail.remark ?? undefined
  }
  isOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<RoleSchema>) {
  if (isEditing.value && editingId.value) {
    const { code: _code, ...rest } = event.data
    await handleUpdate(editingId.value, rest as RoleUpdateReq)
  } else {
    await handleCreate(event.data)
  }
  isOpen.value = false
}

async function onDeleteBatch() {
  await handleDeleteBatch(rowSelectionKeys.value)
  rowSelectionKeys.value = []
}

// 分配菜单（UTree multiple 的 model 为节点对象数组，需与 menuIds 互转）
interface MenuTreeNode { label: string, value: string }
const assignOpen = ref(false)
const assignRoleId = ref<string | null>(null)
const assignSelected = ref<MenuTreeNode[]>([])
const menuTreeItems = computed(() =>
  Tree.transform(menuTree.value, ({ node }) => ({ label: node.name, value: node.id }))
)
const menuTreeFlat = computed(() => Tree.toList(menuTreeItems.value))

async function openAssign(id: string) {
  assignRoleId.value = id
  const detail = await getDetail(id)
  const ids = detail.menuIds ?? []
  assignSelected.value = menuTreeFlat.value.filter(n => ids.includes(n.value))
  assignOpen.value = true
}

async function confirmAssign() {
  if (assignRoleId.value) {
    await handleAssignMenus(assignRoleId.value, assignSelected.value.map(n => n.value))
  }
  assignOpen.value = false
}

const columns: DataTableColumn<RoleResp>[] = [
  { type: 'selection', fixed: 'left', size: 48 },
  { accessorKey: 'code', header: '角色编码' },
  { accessorKey: 'name', header: '角色名称' },
  {
    accessorKey: 'roleType',
    header: '类型',
    cell: ({ row }) => h(
      UBadge,
      { color: row.original.roleType === 'BUILT_IN' ? 'primary' : 'neutral', variant: 'subtle' },
      () => row.original.roleType === 'BUILT_IN' ? '内置' : '自定义'
    )
  },
  { accessorKey: 'roleSort', header: '排序' },
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
    actions: [
      {
        key: 'edit',
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'assign',
        buttonProps: { icon: 'i-lucide-list-tree', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openAssign(row.id)
      },
      {
        key: 'delete',
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        visibility: ({ row }) => row.roleType !== 'BUILT_IN',
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除角色 ${row.name}？`,
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
      :cols="5"
      @submit="onSearch"
      @reset="onSearchReset"
    />

    <AppDataTable
      v-model:pagination="pagination"
      v-model:row-selection-keys="rowSelectionKeys"
      row-key="id"
      :columns="columns"
      :data="roles"
      :loading="pending"
      :pagination-options="{ manualPagination: true, rowCount: total }"
    >
      <template #toolbar-right>
        <UButton
          v-if="rowSelectionKeys.length > 0"
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          @click="onDeleteBatch"
        >
          批量删除（{{ rowSelectionKeys.length }}）
        </UButton>
        <UButton icon="i-lucide-plus" @click="openCreate">
          新增角色
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isOpen" :title="isEditing ? '编辑角色' : '新增角色'" class="w-120">
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

    <USlideover v-model:open="assignOpen" title="分配菜单" class="w-120">
      <template #body>
        <UTree
          v-model="assignSelected"
          :items="menuTreeItems"
          :get-key="(item) => item.value"
          multiple
          propagate-select
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="assignOpen = false">
            取消
          </UButton>
          <UButton @click="confirmAssign">
            确认
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
