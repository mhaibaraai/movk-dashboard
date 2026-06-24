<script setup lang="ts">
import type { DataTableColumn, PaginationState } from '@movk/nuxt'
import type { FormSubmitEvent, InferInput } from '@nuxt/ui'
import type { z } from 'zod'
import { UBadge } from '#components'
import type { DictTypeCreateReq } from '~/api/system/dict'
import { DICT_LIST_CLASS_COLOR, ENABLED_DISABLED_COLOR, ENABLED_DISABLED_LABEL } from '~/constants/system'

const {
  dictTypes, typePending, selectedType, dictData, dataPending,
  handleCreateType, handleUpdateType, handleDeleteType, getTypeDetail,
  handleCreateData, handleUpdateData, handleDeleteData, getDataDetail,
  handleRefreshCache
} = useDictList()
const { afz } = useAutoForm()
const { hasPermission } = usePermission()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const statusItems = [{ label: '启用', value: 'ENABLED' }, { label: '禁用', value: 'DISABLED' }]
const listClassItems = [
  { label: '默认', value: 'default' },
  { label: '主要', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' }
]

const typePagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })
const dataPagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })

// 类型搜索（客户端过滤）
const typeSearchSchema = afz.object({
  dictName: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-book', label: '字典名称' } }).optional(),
  dictType: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-tag', label: '字典类型' } }).optional()
})
type TypeSearch = z.output<typeof typeSearchSchema>
const typeSearchState = ref<Partial<InferInput<typeof typeSearchSchema>>>({})
const appliedTypeSearch = ref<Partial<TypeSearch>>({})

function onTypeSearch(event: FormSubmitEvent<TypeSearch>) {
  appliedTypeSearch.value = event.data
}
function onTypeSearchReset() {
  appliedTypeSearch.value = {}
}

const filteredTypes = computed(() => {
  const { dictName, dictType } = appliedTypeSearch.value
  return dictTypes.value.filter((t) => {
    if (dictName && !t.dictName.toLowerCase().includes(dictName.toLowerCase())) return false
    if (dictType && !t.dictType.toLowerCase().includes(dictType.toLowerCase())) return false
    return true
  })
})

function selectType(dictType: string) {
  selectedType.value = dictType
}

// 类型表单
const isTypeOpen = ref(false)
const isTypeEditing = ref(false)
const editingTypeId = ref<string | null>(null)
const typeFormRef = useTemplateRef('typeFormRef')
const typeState = ref<Partial<DictTypeCreateReq>>({})

const typeSchema = afz.object({
  dictName: afz.string({ controlProps: { placeholder: '请输入字典名称' } })
    .min(1, '请输入字典名称').max(100, '最多 100 字').meta({ label: '字典名称' }),
  dictType: afz.string({ controlProps: () => ({ disabled: isTypeEditing.value, placeholder: '请输入字典类型' }) })
    .min(1, '请输入字典类型').max(100, '最多 100 字').meta({ label: '字典类型' }),
  status: afz.enum(['ENABLED', 'DISABLED'], { controlProps: { valueKey: 'value', items: statusItems } })
    .default('ENABLED').meta({ label: '状态' }),
  remark: afz.string({ type: 'textarea', controlProps: { rows: 3, placeholder: '备注信息' } })
    .max(500, '最多 500 字').optional().meta({ label: '备注' })
})
type TypeSchema = z.output<typeof typeSchema>

function openCreateType() {
  isTypeEditing.value = false
  editingTypeId.value = null
  typeState.value = { status: 'ENABLED' }
  isTypeOpen.value = true
}
async function openEditType(id: string) {
  isTypeEditing.value = true
  editingTypeId.value = id
  const detail = await getTypeDetail(id)
  typeState.value = {
    dictName: detail.dictName,
    dictType: detail.dictType,
    status: detail.status,
    remark: detail.remark ?? undefined
  }
  isTypeOpen.value = true
}
async function onTypeSubmit(event: FormSubmitEvent<TypeSchema>) {
  if (isTypeEditing.value && editingTypeId.value) {
    await handleUpdateType(editingTypeId.value, event.data)
  } else {
    await handleCreateType(event.data)
  }
  isTypeOpen.value = false
}

// 数据表单
const isDataOpen = ref(false)
const isDataEditing = ref(false)
const editingDataId = ref<string | null>(null)
const dataFormRef = useTemplateRef('dataFormRef')
const dataState = ref<Partial<DataSchema>>({})

const dataSchema = afz.object({
  dictType: afz.string({ controlProps: { disabled: true } }).meta({ label: '字典类型' }),
  dictLabel: afz.string({ controlProps: { placeholder: '请输入字典标签' } })
    .min(1, '请输入字典标签').max(100, '最多 100 字').meta({ label: '字典标签' }),
  dictValue: afz.string({ controlProps: { placeholder: '请输入字典键值' } })
    .min(1, '请输入字典键值').max(100, '最多 100 字').meta({ label: '字典键值' }),
  dictSort: afz.number().default(0).meta({ label: '排序' }),
  listClass: afz.enum(['default', 'primary', 'success', 'info', 'warning', 'danger'], {
    type: 'selectMenu',
    controlProps: { clear: true, valueKey: 'value', items: listClassItems }
  }).optional().meta({ label: '回显样式' }),
  isDefault: afz.boolean().default(false).meta({ label: '是否默认' }),
  status: afz.enum(['ENABLED', 'DISABLED'], { controlProps: { valueKey: 'value', items: statusItems } })
    .default('ENABLED').meta({ label: '状态' }),
  remark: afz.string({ type: 'textarea', controlProps: { rows: 3, placeholder: '备注信息' } })
    .max(500, '最多 500 字').optional().meta({ label: '备注' })
})
type DataSchema = z.output<typeof dataSchema>

function openCreateData() {
  if (!selectedType.value) return
  isDataEditing.value = false
  editingDataId.value = null
  dataState.value = { dictType: selectedType.value, status: 'ENABLED', dictSort: 0, isDefault: false }
  isDataOpen.value = true
}
async function openEditData(id: string) {
  isDataEditing.value = true
  editingDataId.value = id
  const detail = await getDataDetail(id)
  dataState.value = {
    dictType: detail.dictType,
    dictLabel: detail.dictLabel,
    dictValue: detail.dictValue,
    dictSort: detail.dictSort,
    listClass: (detail.listClass as DataSchema['listClass']) ?? undefined,
    isDefault: detail.isDefault,
    status: detail.status,
    remark: detail.remark ?? undefined
  }
  isDataOpen.value = true
}
async function onDataSubmit(event: FormSubmitEvent<DataSchema>) {
  if (isDataEditing.value && editingDataId.value) {
    await handleUpdateData(editingDataId.value, event.data)
  } else {
    await handleCreateData(event.data)
  }
  isDataOpen.value = false
}

// 类型详情
const isTypeDetailOpen = ref(false)
const typeDetail = ref<DictTypeResp>()
async function openTypeDetail(id: string) {
  typeDetail.value = await getTypeDetail(id)
  isTypeDetailOpen.value = true
}
const typeDetailItems = computed(() => {
  const d = typeDetail.value
  if (!d) return []
  return [
    { label: '字典名称', key: 'dictName', value: d.dictName },
    { label: '字典类型', key: 'dictType', value: d.dictType },
    { label: '状态', key: 'status', value: d.status },
    { label: '备注', key: 'remark', value: d.remark },
    { label: '创建时间', key: 'createdAt', value: formatter.format(formatter.fromISO(d.createdAt)) },
    { label: '更新时间', key: 'updatedAt', value: formatter.format(formatter.fromISO(d.updatedAt)) }
  ]
})

// 数据详情
const isDataDetailOpen = ref(false)
const dataDetail = ref<DictDataResp>()
async function openDataDetail(id: string) {
  dataDetail.value = await getDataDetail(id)
  isDataDetailOpen.value = true
}
const dataDetailItems = computed(() => {
  const d = dataDetail.value
  if (!d) return []
  return [
    { label: '字典标签', key: 'dictLabel', value: d.dictLabel },
    { label: '字典键值', key: 'dictValue', value: d.dictValue },
    { label: '排序', key: 'dictSort', value: d.dictSort },
    { label: '回显样式', key: 'listClass', value: listClassItems.find(i => i.value === d.listClass)?.label ?? d.listClass },
    { label: '是否默认', key: 'isDefault', value: d.isDefault ? '是' : '否' },
    { label: '状态', key: 'status', value: d.status },
    { label: '备注', key: 'remark', value: d.remark },
    { label: '创建时间', key: 'createdAt', value: formatter.format(formatter.fromISO(d.createdAt)) },
    { label: '更新时间', key: 'updatedAt', value: formatter.format(formatter.fromISO(d.updatedAt)) }
  ]
})

const typeColumns: DataTableColumn<DictTypeResp>[] = [
  { accessorKey: 'dictName', header: '字典名称', sortable: true },
  { accessorKey: 'dictType', header: '字典类型', sortable: true },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => h(
      UBadge,
      { color: ENABLED_DISABLED_COLOR[row.original.status] ?? 'neutral', variant: 'subtle' },
      () => ENABLED_DISABLED_LABEL[row.original.status] ?? row.original.status
    )
  },
  { accessorKey: 'remark', header: '备注', tooltip: true, size: 160 },
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
        visibility: hasPermission('system:dict:query'),
        buttonProps: { icon: 'i-lucide-eye', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openTypeDetail(row.id)
      },
      {
        key: 'data',
        buttonProps: { icon: 'i-lucide-list', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => selectType(row.dictType)
      },
      {
        key: 'edit',
        visibility: hasPermission('system:dict:update'),
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEditType(row.id)
      },
      {
        key: 'delete',
        visibility: hasPermission('system:dict:delete'),
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除字典类型 ${row.dictName}？`,
          description: '删除后无法恢复，请确认。',
          confirmText: '确认删除'
        }),
        onClick: async ({ row }) => {
          await handleDeleteType(row.id)
        }
      }
    ]
  }
]

const dataColumns: DataTableColumn<DictDataResp>[] = [
  {
    accessorKey: 'dictLabel',
    header: '字典标签',
    cell: ({ row }) => h(
      UBadge,
      { color: DICT_LIST_CLASS_COLOR[row.original.listClass ?? 'default'] ?? 'neutral', variant: 'subtle' },
      () => row.original.dictLabel
    )
  },
  { accessorKey: 'dictValue', header: '字典键值' },
  { accessorKey: 'dictSort', header: '排序', sortable: true },
  {
    accessorKey: 'isDefault',
    header: '默认',
    cell: ({ row }) => h(
      UBadge,
      { color: row.original.isDefault ? 'primary' : 'neutral', variant: 'subtle' },
      () => row.original.isDefault ? '是' : '否'
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
  { accessorKey: 'remark', header: '备注', tooltip: true, size: 160 },
  {
    type: 'actions',
    fixed: 'right',
    size: 150,
    maxInline: 3,
    actions: [
      {
        key: 'detail',
        visibility: hasPermission('system:dict:query'),
        buttonProps: { icon: 'i-lucide-eye', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openDataDetail(row.id)
      },
      {
        key: 'edit',
        visibility: hasPermission('system:dict:update'),
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEditData(row.id)
      },
      {
        key: 'delete',
        visibility: hasPermission('system:dict:delete'),
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除字典数据 ${row.dictLabel}？`,
          description: '删除后无法恢复，请确认。',
          confirmText: '确认删除'
        }),
        onClick: async ({ row }) => {
          await handleDeleteData(row.id)
        }
      }
    ]
  }
]
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row min-h-0 flex-1">
    <div class="flex min-w-0 flex-col gap-4 lg:w-2/5 min-h-0">
      <MSearchForm
        v-model="typeSearchState"
        :schema="typeSearchSchema"
        :global-meta="{ label: '' }"
        :cols="3"
        @submit="onTypeSearch"
        @reset="onTypeSearchReset"
      />
      <AppDataTable
        v-model:pagination="typePagination"
        row-key="id"
        :columns="typeColumns"
        :data="filteredTypes"
        :loading="typePending"
      >
        <template #toolbar-right>
          <UButton v-permission="'system:dict:create'" icon="i-lucide-plus" @click="openCreateType">
            新增类型
          </UButton>
        </template>
      </AppDataTable>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-4 min-h-0">
      <AppDataTable
        v-model:pagination="dataPagination"
        row-key="id"
        :columns="dataColumns"
        :data="dictData"
        :loading="dataPending"
      >
        <template #toolbar-left>
          <span class="text-sm text-muted">
            {{ selectedType ? `字典数据：${selectedType}` : '请选择左侧字典类型' }}
          </span>
        </template>
        <template #toolbar-right>
          <UButton icon="i-lucide-refresh-cw" variant="outline" color="neutral" @click="handleRefreshCache">
            刷新缓存
          </UButton>
          <UButton v-permission="'system:dict:create'" icon="i-lucide-plus" :disabled="!selectedType" @click="openCreateData">
            新增数据
          </UButton>
        </template>
      </AppDataTable>
    </div>

    <USlideover v-model:open="isTypeDetailOpen" title="字典类型详情" class="w-120">
      <template #body>
        <AppDescriptions v-if="typeDetail" :items="typeDetailItems">
          <template #status>
            <UBadge :color="ENABLED_DISABLED_COLOR[typeDetail?.status ?? ''] ?? 'neutral'" variant="subtle">
              {{ ENABLED_DISABLED_LABEL[typeDetail?.status ?? ''] ?? typeDetail?.status }}
            </UBadge>
          </template>
        </AppDescriptions>
      </template>
    </USlideover>

    <USlideover v-model:open="isDataDetailOpen" title="字典数据详情" class="w-120">
      <template #body>
        <AppDescriptions v-if="dataDetail" :items="dataDetailItems">
          <template #dictLabel>
            <UBadge :color="DICT_LIST_CLASS_COLOR[dataDetail?.listClass ?? 'default'] ?? 'neutral'" variant="subtle">
              {{ dataDetail?.dictLabel }}
            </UBadge>
          </template>
          <template #status>
            <UBadge :color="ENABLED_DISABLED_COLOR[dataDetail?.status ?? ''] ?? 'neutral'" variant="subtle">
              {{ ENABLED_DISABLED_LABEL[dataDetail?.status ?? ''] ?? dataDetail?.status }}
            </UBadge>
          </template>
        </AppDescriptions>
      </template>
    </USlideover>

    <USlideover v-model:open="isTypeOpen" :title="isTypeEditing ? '编辑字典类型' : '新增字典类型'" class="w-120">
      <template #body>
        <MAutoForm
          ref="typeFormRef"
          :schema="typeSchema"
          :state="typeState"
          :submit="false"
          @submit="onTypeSubmit"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="isTypeOpen = false">
            取消
          </UButton>
          <UButton @click="typeFormRef?.formRef?.submit()">
            保存
          </UButton>
        </div>
      </template>
    </USlideover>

    <USlideover v-model:open="isDataOpen" :title="isDataEditing ? '编辑字典数据' : '新增字典数据'" class="w-120">
      <template #body>
        <MAutoForm
          ref="dataFormRef"
          :schema="dataSchema"
          :state="dataState"
          :submit="false"
          @submit="onDataSubmit"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="isDataOpen = false">
            取消
          </UButton>
          <UButton @click="dataFormRef?.formRef?.submit()">
            保存
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
