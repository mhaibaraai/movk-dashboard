import { Tree } from '@movk/core'

export interface SelectOption {
  label: string
  value: string
}

// 聚合用户表单关系字段所需的选项源：部门（下拉 + 左树）、角色、岗位
export function useUserFormOptions() {
  const { tree: deptTree } = useDeptTree()
  const { posts } = usePostList()

  const { data: roleData } = useApiFetch<PageResp<RoleResp>>('/v1/system/roles', {
    query: { page: 0, size: 1000 },
    toast: false
  })

  // 部门树扁平为下拉选项
  const deptOptions = computed<SelectOption[]>(() =>
    Tree.toList(deptTree.value).map(d => ({ label: d.deptName, value: d.id }))
  )

  // 部门树适配为 UTree items（保留层级）
  const deptTreeItems = computed(() =>
    Tree.transform(deptTree.value, ({ node }) => ({ label: node.deptName, value: node.id }))
  )

  const roleOptions = computed<SelectOption[]>(() =>
    (roleData.value?.content ?? []).map(r => ({ label: r.name, value: r.id }))
  )

  const postOptions = computed<SelectOption[]>(() =>
    posts.value.map(p => ({ label: p.postName, value: p.id }))
  )

  return {
    deptOptions,
    deptTreeItems,
    roleOptions,
    postOptions
  }
}
