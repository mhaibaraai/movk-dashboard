<script setup lang="ts">
interface DescriptionItem {
  label: string
  key: string
  value?: unknown
}

defineProps<{
  items: DescriptionItem[]
}>()

// 空值统一回退为 -，枚举/徽标由具名插槽覆盖
function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}
</script>

<template>
  <dl class="divide-y divide-default rounded-lg border border-default">
    <div v-for="item in items" :key="item.key" class="flex gap-4 px-4 py-3">
      <dt class="w-28 shrink-0 text-sm text-muted">
        {{ item.label }}
      </dt>
      <dd class="min-w-0 flex-1 break-all text-sm text-highlighted">
        <slot :name="item.key" :value="item.value">
          {{ display(item.value) }}
        </slot>
      </dd>
    </div>
  </dl>
</template>
