<script setup lang="ts">
import type { DataTableColumn, PaginationState } from '@movk/nuxt'
import type { FormSubmitEvent, InferInput } from '@nuxt/ui'
import type { z } from 'zod'
import { UBadge } from '#components'
import type { ConfigCreateReq, ConfigUpdateReq } from '~/api/system/config'
import { CONFIG_TYPE_COLOR, CONFIG_TYPE_LABEL } from '~/constants/system'

const { configs, pending, handleCreate, handleUpdate, handleDelete, handleRefreshCache, getDetail } = useConfigList()
const { afz } = useAutoForm()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })

const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })

const typeItems = [{ label: '内置', value: 'BUILTIN' }, { label: '自定义', value: 'CUSTOM' }]

// 顶部搜索（后端无 query 参数，客户端过滤）
const searchSchema = afz.object({
  configName: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-settings', label: '配置名称' } }).optional(),
  configKey: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-key', label: '配置键名' } }).optional(),
  configType: afz.enum(['BUILTIN', 'CUSTOM'], {
    type: 'selectMenu',
    controlProps: { icon: 'i-lucide-tag', placeholder: '配置类型', clear: true, valueKey: 'value', items: typeItems }
  }).optional()
})
type ConfigSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<InferInput<typeof searchSchema>>>({})
const appliedSearch = ref<Partial<ConfigSearch>>({})

function onSearch(event: FormSubmitEvent<ConfigSearch>) {
  appliedSearch.value = event.data
}
function onSearchReset() {
  appliedSearch.value = {}
}

const filteredConfigs = computed(() => {
  const { configName, configKey, configType } = appliedSearch.value
  return configs.value.filter((c) => {
    if (configName && !c.configName.toLowerCase().includes(configName.toLowerCase())) return false
    if (configKey && !c.configKey.toLowerCase().includes(configKey.toLowerCase())) return false
    if (configType && c.configType !== configType) return false
    return true
  })
})

const isOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = useTemplateRef('formRef')
const state = ref<Partial<ConfigCreateReq>>({})

const schema = afz.object({
  configName: afz.string({ controlProps: { placeholder: '请输入配置名称' } })
    .min(1, '请输入配置名称').max(100, '最多 100 字').meta({ label: '配置名称' }),
  configKey: afz.string({ controlProps: () => ({ disabled: isEditing.value, placeholder: '请输入配置键名' }) })
    .min(1, '请输入配置键名').max(100, '最多 100 字').meta({ label: '配置键名' }),
  configValue: afz.string({ controlProps: { placeholder: '请输入配置值' } })
    .max(500, '最多 500 字').optional().meta({ label: '配置值' }),
  configType: afz.enum(['BUILTIN', 'CUSTOM'], {
    controlProps: { valueKey: 'value', items: typeItems }
  }).default('CUSTOM').meta({ label: '配置类型' }),
  remark: afz.string({ type: 'textarea', controlProps: { rows: 3, placeholder: '备注信息' } })
    .max(500, '最多 500 字').optional().meta({ label: '备注' })
})

type ConfigSchema = z.output<typeof schema>

function openCreate() {
  isEditing.value = false
  editingId.value = null
  state.value = { configType: 'CUSTOM' }
  isOpen.value = true
}

async function openEdit(id: string) {
  isEditing.value = true
  editingId.value = id
  const detail = await getDetail(id)
  state.value = {
    configName: detail.configName,
    configKey: detail.configKey,
    configValue: detail.configValue,
    configType: detail.configType,
    remark: detail.remark ?? undefined
  }
  isOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<ConfigSchema>) {
  if (isEditing.value && editingId.value) {
    await handleUpdate(editingId.value, event.data as ConfigUpdateReq)
  } else {
    await handleCreate(event.data)
  }
  isOpen.value = false
}

const columns: DataTableColumn<ConfigResp>[] = [
  { accessorKey: 'configName', header: '配置名称', sortable: true },
  { accessorKey: 'configKey', header: '配置键名', sortable: true },
  { accessorKey: 'configValue', header: '配置值', tooltip: true, size: 240 },
  {
    accessorKey: 'configType',
    header: '配置类型',
    cell: ({ row }) => h(
      UBadge,
      { color: CONFIG_TYPE_COLOR[row.original.configType] ?? 'neutral', variant: 'subtle' },
      () => CONFIG_TYPE_LABEL[row.original.configType] ?? row.original.configType
    )
  },
  { accessorKey: 'remark', header: '备注', tooltip: true, size: 200 },
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
        buttonProps: ({ row }) => ({
          icon: 'i-lucide-trash-2',
          color: 'error',
          variant: 'ghost',
          size: 'xs',
          disabled: row.configType === 'BUILTIN'
        }),
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除配置 ${row.configName}？`,
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
      row-key="id"
      :columns="columns"
      :data="filteredConfigs"
      :loading="pending"
    >
      <template #toolbar-right>
        <UButton icon="i-lucide-refresh-cw" variant="outline" color="neutral" @click="handleRefreshCache">
          刷新缓存
        </UButton>
        <UButton icon="i-lucide-plus" @click="openCreate">
          新增配置
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isOpen" :title="isEditing ? '编辑配置' : '新增配置'" class="w-120">
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
