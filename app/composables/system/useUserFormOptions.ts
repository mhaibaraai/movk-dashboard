import type { SelectOption } from './useDeptOptions'

// 聚合用户表单关系字段所需的选项源：部门（下拉 + 左树）、角色、岗位
export function useUserFormOptions() {
  const { deptOptions, deptTreeItems } = useDeptOptions()

  const { data: roleData } = useApiFetch<PageResp<RoleResp>>('/v1/system/roles', {
    query: { page: 0, size: 1000 },
    toast: false
  })

  const { data: postData } = useApiFetch<PageResp<PostResp>>('/v1/system/posts', {
    query: { page: 0, size: 1000 },
    toast: false
  })

  const roleOptions = computed<SelectOption[]>(() =>
    (roleData.value?.content ?? []).map(r => ({ label: r.name, value: r.id }))
  )

  const postOptions = computed<SelectOption[]>(() =>
    (postData.value?.content ?? []).map(p => ({ label: p.postName, value: p.id }))
  )

  return {
    deptOptions,
    deptTreeItems,
    roleOptions,
    postOptions
  }
}
