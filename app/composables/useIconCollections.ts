interface IconCollections {
  custom: string[]
  lucide: string[]
}

// 拉取可选图标集合（本地 custom + lucide），按 key 去重缓存，多个 IconPicker 实例共享一次请求
export function useIconCollections() {
  const { data, pending } = useAsyncData(
    'icon-collections',
    () => $fetch<IconCollections>('/api/system/icons'),
    { default: () => ({ custom: [], lucide: [] }) }
  )

  const custom = computed(() => data.value?.custom ?? [])
  const lucide = computed(() => data.value?.lucide ?? [])

  return { custom, lucide, pending }
}
