<script setup lang="ts">
interface IconPickerProps {
  /** 未选中时的占位文案 */
  placeholder?: string
  disabled?: boolean
  /** 是否显示清除按钮 */
  clear?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

withDefaults(defineProps<IconPickerProps>(), {
  placeholder: '选择图标',
  size: 'md'
})

const emit = defineEmits<{ change: [value: string | undefined] }>()

defineOptions({ inheritAttrs: false })

const modelValue = defineModel<string>()

const displayIcon = computed(() => normalizeIconName(modelValue.value) ?? 'i-lucide-image')

const { custom, lucide, pending } = useIconCollections()

const open = ref(false)
const search = ref('')

// lucide 图标 1800+，限制单次渲染数量；custom 数量很少，整组展示
const RENDER_LIMIT = 120

const keyword = computed(() => search.value.trim().toLowerCase().replace(/^i-(?:custom|lucide)-/, ''))

function match(list: string[]) {
  return keyword.value ? list.filter(name => name.includes(keyword.value)) : list
}

const customMatches = computed(() => match(custom.value))
const lucideMatches = computed(() => match(lucide.value))
const lucideVisible = computed(() => lucideMatches.value.slice(0, RENDER_LIMIT))
const truncated = computed(() => lucideMatches.value.length > RENDER_LIMIT)
const hasResult = computed(() => customMatches.value.length > 0 || lucideVisible.value.length > 0)

const groups = computed(() => [
  { key: 'custom', label: '自定义', icons: customMatches.value },
  { key: 'lucide', label: 'Lucide', icons: lucideVisible.value }
].filter(group => group.icons.length > 0))

function select(name: string) {
  modelValue.value = name
  emit('change', name)
  open.value = false
  search.value = ''
}

function clearValue() {
  modelValue.value = undefined
  emit('change', undefined)
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start' }" :ui="{ content: 'w-80' }">
    <UButton
      color="neutral"
      variant="subtle"
      :size="size"
      :disabled="disabled"
      class="w-full justify-start"
      trailing-icon="i-lucide-chevron-down"
      :ui="{ trailingIcon: 'shrink-0' }"
    >
      <UIcon :name="displayIcon" class="size-5 shrink-0" :class="!modelValue && 'text-dimmed'" />
      <span class="flex-1 truncate text-left" :class="!modelValue && 'text-dimmed'">
        {{ modelValue || placeholder }}
      </span>
      <UIcon
        v-if="clear && modelValue"
        name="i-lucide-x"
        class="size-4 shrink-0 text-dimmed transition-colors hover:text-default"
        role="button"
        tabindex="0"
        aria-label="清除图标"
        @click.stop="clearValue"
        @keydown.enter.stop="clearValue"
      />
    </UButton>

    <template #content>
      <div class="flex flex-col gap-2 p-2">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="搜索图标"
          autofocus
          size="sm"
        />

        <div v-if="pending" class="flex items-center justify-center py-8 text-sm text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
        </div>
        <template v-else>
          <div v-if="hasResult" class="flex flex-col gap-2 max-h-72 overflow-y-auto">
            <div v-for="group in groups" :key="group.key" class="flex flex-col gap-1">
              <p class="px-1 text-xs font-medium text-muted">
                {{ group.label }}
              </p>
              <div class="grid grid-cols-8 gap-1">
                <UButton
                  v-for="name in group.icons"
                  :key="name"
                  square
                  variant="ghost"
                  :color="name === modelValue ? 'primary' : 'neutral'"
                  :title="name"
                  @click="select(name)"
                >
                  <UIcon :name="name" class="size-5" />
                </UButton>
              </div>
            </div>
          </div>
          <p v-else class="py-8 text-center text-sm text-muted">
            未找到匹配的图标
          </p>
          <p v-if="truncated" class="text-center text-xs text-dimmed">
            继续输入以缩小 Lucide 范围
          </p>
        </template>
      </div>
    </template>
  </UPopover>
</template>
