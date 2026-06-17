import type { PaginationState } from '@movk/nuxt'

// 将 MDataTable 的 PaginationState 同步到列表 composable 的服务端查询
export function useTablePagination(
  initialSize: number,
  onChange: (page: number, size: number) => void
) {
  const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: initialSize })

  watch(
    pagination,
    ({ pageIndex, pageSize }) => onChange(pageIndex, pageSize),
    { deep: true }
  )

  return pagination
}
