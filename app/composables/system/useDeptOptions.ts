import { Tree } from '@movk/core'

export interface SelectOption {
  label: string
  value: string
}

// 部门选项源：下拉（扁平）+ UTree items（保留层级）
export function useDeptOptions() {
  const { tree: deptTree } = useDeptTree()

  const deptOptions = computed<SelectOption[]>(() =>
    Tree.toList(deptTree.value).map(d => ({ label: d.deptName, value: d.id }))
  )

  const deptTreeItems = computed(() =>
    Tree.transform(deptTree.value, ({ node }) => ({ label: node.deptName, value: node.id }))
  )

  return {
    deptOptions,
    deptTreeItems
  }
}
