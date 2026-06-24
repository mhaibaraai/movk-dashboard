<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { Tree } from '@movk/core'
import { IconPicker, UBadge, UIcon } from '#components'
import type { MenuCreateReq, MenuUpdateReq } from '~/api/system/menu'
import {
  ENABLED_DISABLED_COLOR, ENABLED_DISABLED_LABEL,
  MENU_TYPE_COLOR, MENU_TYPE_ICON, MENU_TYPE_LABEL
} from '~/constants/system'

const { tree, pending, handleCreate, handleUpdate, handleDelete, getDetail } = useMenuTree()
const { afz, controls } = useAutoForm({ iconPicker: { component: IconPicker } })
const { hasPermission } = usePermission()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

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
  icon: afz.string({ type: 'iconPicker', controlProps: { placeholder: '选择图标', clear: true } })
    .optional().meta({ label: '图标' }),
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

// 详情
const isDetailOpen = ref(false)
const detail = ref<MenuResp>()
async function openDetail(id: string) {
  detail.value = await getDetail(id)
  isDetailOpen.value = true
}

const detailItems = computed(() => {
  const d = detail.value
  if (!d) return []
  return [
    { label: '菜单名称', key: 'name', value: d.name },
    { label: '类型', key: 'type', value: d.type },
    { label: '图标', key: 'icon', value: d.icon },
    { label: '路由地址', key: 'path', value: d.path },
    { label: '组件路径', key: 'component', value: d.component },
    { label: '权限标识', key: 'permissionCode', value: d.permissionCode },
    { label: '排序', key: 'orderNum', value: d.orderNum },
    { label: '是否外链', key: 'isFrame', value: d.isFrame ? '是' : '否' },
    { label: '是否缓存', key: 'isCache', value: d.isCache ? '是' : '否' },
    { label: '是否显示', key: 'visible', value: d.visible ? '是' : '否' },
    { label: '状态', key: 'status', value: d.status },
    { label: '备注', key: 'remark', value: d.remark },
    { label: '创建时间', key: 'createdAt', value: formatter.format(formatter.fromISO(d.createdAt)) },
    { label: '更新时间', key: 'updatedAt', value: formatter.format(formatter.fromISO(d.updatedAt)) }
  ]
})

const columns: DataTableColumn<MenuResp>[] = [
  { type: 'expand' },
  {
    accessorKey: 'name',
    header: '菜单名称',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(UIcon, { name: normalizeIconName(row.original.icon) || MENU_TYPE_ICON[row.original.type] || 'i-lucide-file', class: 'text-muted' }),
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
    maxInline: 4,
    actions: [
      {
        key: 'detail',
        visibility: hasPermission('system:menu:query'),
        buttonProps: { icon: 'i-lucide-eye', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openDetail(row.id)
      },
      {
        key: 'addChild',
        visibility: hasPermission('system:menu:create'),
        buttonProps: { icon: 'i-lucide-plus', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openCreate(row.id)
      },
      {
        key: 'edit',
        visibility: hasPermission('system:menu:update'),
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'delete',
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        visibility: ({ row }) => hasPermission('system:menu:delete') && !(row.children && row.children.length),
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
  <div class="flex flex-col gap-4 min-h-0 flex-1">
    <AppDataTable
      children-key="children"
      row-key="id"
      :columns="columns"
      :data="tree"
      :loading="pending"
      :default-expanded="1"
      :pagination-ui="{}"
    >
      <template #toolbar-right>
        <UButton v-permission="'system:menu:create'" icon="i-lucide-plus" @click="openCreate()">
          新增菜单
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isDetailOpen" title="菜单详情" class="w-120">
      <template #body>
        <AppDescriptions v-if="detail" :items="detailItems">
          <template #type>
            <UBadge :color="MENU_TYPE_COLOR[detail?.type ?? ''] ?? 'neutral'" variant="subtle">
              {{ MENU_TYPE_LABEL[detail?.type ?? ''] ?? detail?.type }}
            </UBadge>
          </template>
          <template #icon>
            <span v-if="detail?.icon" class="flex items-center gap-2">
              <UIcon :name="normalizeIconName(detail.icon)" />
              {{ detail.icon }}
            </span>
            <span v-else>-</span>
          </template>
          <template #status>
            <UBadge :color="ENABLED_DISABLED_COLOR[detail?.status ?? ''] ?? 'neutral'" variant="subtle">
              {{ ENABLED_DISABLED_LABEL[detail?.status ?? ''] ?? detail?.status }}
            </UBadge>
          </template>
        </AppDescriptions>
      </template>
    </USlideover>

    <USlideover v-model:open="isOpen" :title="isEditing ? '编辑菜单' : '新增菜单'" class="w-120">
      <template #body>
        <MAutoForm
          ref="formRef"
          :schema="schema"
          :state="state"
          :controls="controls"
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
