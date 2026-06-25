import type { SemanticColor } from '@movk/nuxt'
import type { MaybeRefOrGetter } from 'vue'

export function useDict(dictType: MaybeRefOrGetter<string>) {
  const type = computed(() => toValue(dictType))

  const { data, pending } = useApiFetch<DictDataResp[]>('/v1/system/dicts/data', {
    query: { dictType: type },
    toast: false,
    server: false
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
    return value ? (labelMap.value[value] ?? '') : ''
  }

  function getColor(value?: string) {
    return value ? (colorMap.value[value] ?? 'neutral') : 'neutral'
  }

  return { items, options, labelMap, colorMap, defaultValue, getLabel, getColor, pending }
}
