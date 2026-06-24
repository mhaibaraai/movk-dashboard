import type { SemanticColor } from '@movk/nuxt'
import type { MaybeRefOrGetter } from 'vue'

// 按字典类型拉取字典数据并派生消费视图（选项 / 标签映射 / 颜色映射）
// 同一 dictType 借 useApiFetch 的请求键自动去重，多处使用只发一次请求
export function useDict(dictType: MaybeRefOrGetter<string>) {
  const type = computed(() => toValue(dictType))

  const { data, pending } = useApiFetch<DictDataResp[]>('/v1/system/dicts/data', {
    query: { dictType: type },
    watch: [type],
    toast: false
  })

  const items = computed(() =>
    [...(data.value ?? [])]
      .filter(d => d.status === 'ENABLED')
      .sort((a, b) => a.dictSort - b.dictSort))

  const options = computed(() => items.value.map(d => ({ label: d.dictLabel, value: d.dictValue })))

  const labelMap = computed<Record<string, string>>(() =>
    Object.fromEntries(items.value.map(d => [d.dictValue, d.dictLabel])))

  const colorMap = computed<Record<string, SemanticColor>>(() =>
    Object.fromEntries(items.value.map(d =>
      [d.dictValue, d.listClass ?? 'neutral'])))

  const defaultValue = computed(() => items.value.find(d => d.isDefault)?.dictValue)

  function getLabel(value?: string): string {
    return value ? (labelMap.value[value] ?? value) : ''
  }
  function getColor(value?: string) {
    return value ? colorMap.value[value] : 'neutral'
  }

  return { items, options, labelMap, colorMap, defaultValue, getLabel, getColor, pending }
}
