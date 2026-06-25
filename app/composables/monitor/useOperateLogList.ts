import { useOperateLogApi } from '~/api/monitor/operate-log'

export function useOperateLogList() {
  const operateLogApi = useOperateLogApi()

  const query = ref<OperateLogListQuery>({ page: 0, size: 10 })

  const { data, pending, refresh } = useApiFetch<PageResp<OperateLogResp>>('/v1/monitor/operate-logs', {
    query,
    toast: false
  })

  const logs = computed(() => data.value?.content ?? [])
  const total = computed(() => data.value?.page?.totalElements ?? 0)

  async function handleClean(days: number) {
    await operateLogApi.clean(days)
    await refresh()
  }
  async function getDetail(id: number) {
    return operateLogApi.getById(id)
  }

  function handlePagination(page: number, size: number) {
    query.value = { ...query.value, page, size }
  }
  function handleSearch(params: Partial<OperateLogListQuery>) {
    query.value = { ...query.value, ...params, page: 0 }
  }

  return {
    query: readonly(query),
    logs,
    total,
    pending,
    refresh,
    handleClean,
    getDetail,
    handlePagination,
    handleSearch
  }
}
