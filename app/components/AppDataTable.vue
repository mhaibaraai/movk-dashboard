<script setup lang="ts" generic="T extends Record<string, any>">
import type { DataTableProps, DataTableDataColumn } from '@movk/nuxt'
import type { DropdownMenuItem } from '@nuxt/ui'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DataTableProps<T>>(), {
  resizable: true,
  stripe: true,
  sticky: true,
  density: 'normal',
  paginationUi: () => ({ pageSizes: [5, 10, 20, 50] })
})

const slots = useSlots()
const tableRef = useTemplateRef('tableRef')
const tableApi = computed(() => tableRef.value?.tableApi ?? null)

// 透传给 MDataTable 的具名插槽（排除工具栏插槽）
const tableSlotNames = computed(() =>
  Object.keys(slots).filter(name => !name.startsWith('toolbar'))
)

// 表格填满容器并内部滚动：wrapper 取 flex-1，UTable root（overflow-auto）成为滚动容器，
// 合并调用方传入的 ui 而非覆盖
const tableUi = computed(() => ({
  ...props.ui,
  wrapper: ['flex-1', props.ui?.wrapper],
  root: ['flex-1 min-h-0', props.ui?.root]
}))

// 列显隐：标签取自源列定义（resizable 下 columnDef.header 已是函数），
// 可见态/切换走 tableApi；无 accessorKey 的 selection/actions 自动排除
const columnItems = computed<DropdownMenuItem[]>(() => {
  const api = tableApi.value
  if (!api) return []
  return (props.columns ?? [])
    .filter((c): c is DataTableDataColumn<T> => 'accessorKey' in c && typeof c.header === 'string')
    .map((c) => {
      const col = api.getColumn(c.accessorKey)
      return {
        label: c.header as string,
        type: 'checkbox' as const,
        checked: col?.getIsVisible() ?? true,
        onUpdateChecked: (checked: boolean) => col?.toggleVisibility(checked),
        onSelect: (e: Event) => e.preventDefault()
      }
    })
})

defineExpose({ tableApi })
</script>

<template>
  <div class="flex flex-col gap-3 min-h-0 flex-1">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <slot name="toolbar-left" />
      </div>
      <div class="flex items-center gap-2">
        <slot name="toolbar-right" />
        <UDropdownMenu
          v-if="columnItems.length"
          :items="columnItems"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="i-lucide-settings-2"
            color="neutral"
            variant="outline"
            aria-label="列设置"
          />
        </UDropdownMenu>
      </div>
    </div>

    <MDataTable ref="tableRef" v-bind="{ ...props, ...$attrs }" :ui="tableUi">
      <template v-for="name in tableSlotNames" #[name]="slotProps" :key="name">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </MDataTable>
  </div>
</template>
