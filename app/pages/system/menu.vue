<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { Tree } from '@movk/core'
import { UBadge, UIcon } from '#components'
import type { MenuCreateReq, MenuUpdateReq } from '~/api/system/menu'
import {
  ENABLED_DISABLED_COLOR, ENABLED_DISABLED_LABEL,
  MENU_TYPE_COLOR, MENU_TYPE_ICON, MENU_TYPE_LABEL
} from '~/constants/system'

const { tree, pending, handleCreate, handleUpdate, handleDelete, getDetail } = useMenuTree()
const { afz } = useAutoForm()

const statusItems = [{ label: '启用', value: 'ENABLED' }, { label: '禁用', value: 'DISABLED' }]
const typeItems = [
  { label: '目录', value: 'DIRECTORY' },
  { label: '菜单', value: 'MENU' },
  { label: '按钮', value: 'BUTTON' }
]
const menuOptions = computed(() => Tree.toList(tree.value).map(m => ({ label: m.name, value: m.id })))

const isOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = useTemplateRef('formRef')
const state = ref<Partial<MenuCreateReq>>({})

const schema = afz.object({
  parentId: afz.enum([], {
    type: 'selectMenu',
    controlProps: () => ({ placeholder: '上级菜单（留空为顶级）', clear: true, valueKey: 'value', items: menuOptions.value })
  }).optional().meta({ label: '上级菜单' }),
  type: afz.enum(['DIRECTORY', 'MENU', 'BUTTON'], {
    controlProps: { valueKey: 'value', items: typeItems }
  }).default('MENU').meta({ label: '菜单类型' }),
  name: afz.string({ controlProps: { placeholder: '请输入菜单名称' } })
    .max(50, '最多 50 字').meta({ label: '菜单名称' }),
  icon: afz.string({ controlProps: { placeholder: '如：i-lucide-home' } }).optional().meta({ label: '图标' }),
  orderNum: afz.number().default(0).meta({ label: '排序' }),
  path: afz.string({ controlProps: { placeholder: '如：/system/user' } }).optional()
    .meta({ label: '路由地址', if: ({ state }: { state: Partial<MenuCreateReq> }) => state.type !== 'BUTTON' }),
  component: afz.string({ controlProps: { placeholder: '如：system/user' } }).optional()
    .meta({ label: '组件路径', if: ({ state }: { state: Partial<MenuCreateReq> }) => state.type === 'MENU' }),
  permissionCode: afz.string({ controlProps: { placeholder: '如：system:user:list' } }).optional()
    .meta({ label: '权限标识', if: ({ state }: { state: Partial<MenuCreateReq> }) => state.type === 'BUTTON' }),
  isFrame: afz.boolean({ type: 'switch' }).default(false)
    .meta({ label: '是否外链', if: ({ state }: { state: Partial<MenuCreateReq> }) => state.type !== 'BUTTON' }),
  isCache: afz.boolean({ type: 'switch' }).default(false)
    .meta({ label: '是否缓存', if: ({ state }: { state: Partial<MenuCreateReq> }) => state.type !== 'BUTTON' }),
  visible: afz.boolean({ type: 'switch' }).default(true)
    .meta({ label: '是否显示', if: ({ state }: { state: Partial<MenuCreateReq> }) => state.type !== 'BUTTON' }),
  status: afz.enum(['ENABLED', 'DISABLED'], {
    controlProps: { valueKey: 'value', items: statusItems }
  }).default('ENABLED').meta({ label: '状态' }),
  remark: afz.string({ type: 'textarea', controlProps: { rows: 3, placeholder: '备注信息' } })
    .max(500, '最多 500 字').optional().meta({ label: '备注' })
})
type MenuSchema = z.output<typeof schema>

function openCreate(parentId?: string) {
  isEditing.value = false
  editingId.value = null
  state.value = { type: 'MENU', status: 'ENABLED', orderNum: 0, visible: true, isFrame: false, isCache: false, parentId }
  isOpen.value = true
}

async function openEdit(id: string) {
  isEditing.value = true
  editingId.value = id
  const detail = await getDetail(id)
  state.value = {
    parentId: detail.parentId ?? undefined,
    type: detail.type,
    name: detail.name,
    icon: detail.icon ?? undefined,
    orderNum: detail.orderNum,
    path: detail.path ?? undefined,
    component: detail.component ?? undefined,
    permissionCode: detail.permissionCode ?? undefined,
    isFrame: detail.isFrame,
    isCache: detail.isCache,
    visible: detail.visible,
    status: detail.status,
    remark: detail.remark ?? undefined
  }
  isOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<MenuSchema>) {
  if (isEditing.value && editingId.value) {
    await handleUpdate(editingId.value, event.data as MenuUpdateReq)
  } else {
    await handleCreate(event.data)
  }
  isOpen.value = false
}

const columns: DataTableColumn<MenuResp>[] = [
  { type: 'expand' },
  {
    accessorKey: 'name',
    header: '菜单名称',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(UIcon, { name: MENU_TYPE_ICON[row.original.type] ?? 'i-lucide-file', class: 'text-muted' }),
      h('span', row.original.name)
    ])
  },
  {
    accessorKey: 'type',
    header: '类型',
    cell: ({ row }) => h(
      UBadge,
      { color: MENU_TYPE_COLOR[row.original.type] ?? 'neutral', variant: 'subtle' },
      () => MENU_TYPE_LABEL[row.original.type] ?? row.original.type
    )
  },
  { accessorKey: 'permissionCode', header: '权限标识' },
  { accessorKey: 'path', header: '路由地址' },
  { accessorKey: 'orderNum', header: '排序' },
  {
    accessorKey: 'visible',
    header: '显示',
    cell: ({ row }) => h(
      UBadge,
      { color: row.original.visible ? 'success' : 'neutral', variant: 'subtle' },
      () => row.original.visible ? '显示' : '隐藏'
    )
  },
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
    type: 'actions',
    fixed: 'right',
    size: 150,
    actions: [
      {
        key: 'addChild',
        buttonProps: { icon: 'i-lucide-plus', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openCreate(row.id)
      },
      {
        key: 'edit',
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'delete',
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        visibility: ({ row }) => !(row.children && row.children.length),
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除菜单 ${row.name}？`,
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
    <AppDataTable
      children-key="children"
      row-key="id"
      :columns="columns"
      :data="tree"
      :loading="pending"
    >
      <template #toolbar-right>
        <UButton icon="i-lucide-plus" @click="openCreate()">
          新增菜单
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isOpen" :title="isEditing ? '编辑菜单' : '新增菜单'" class="w-120">
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
