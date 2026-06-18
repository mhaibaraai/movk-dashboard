import type { SelectOption } from './useDeptOptions'

// 用户下拉选项源：部门负责人等关系字段选择器复用
export function useUserOptions() {
  const { data } = useApiFetch<PageResp<UserResp>>('/v1/system/users', {
    query: { page: 0, size: 1000 },
    toast: false
  })

  const userOptions = computed<SelectOption[]>(() =>
    (data.value?.content ?? []).map(u => ({ label: u.nickname ?? u.username, value: u.id }))
  )

  return { userOptions }
}
