import { useLoginLogApi } from '~/api/monitor/login-log'

export function useLoginLogList() {
  const loginLogApi = useLoginLogApi()

  const query = ref<LoginLogListQuery>({ page: 0, size: 10 })

  const { data, pending, refresh } = useApiFetch<PageResp<LoginLogResp>>('/v1/monitor/login-logs', {
    query,
    watch: [query],
    toast: false
  })

  const logs = computed(() => data.value?.content ?? [])
  const total = computed(() => data.value?.page?.totalElements ?? 0)

  async function handleClean(days: number) {
    await loginLogApi.clean(days)
    await refresh()
  }
  async function getDetail(id: number) {
    return loginLogApi.getById(id)
  }

  function handlePagination(page: number, size: number) {
    query.value = { ...query.value, page, size }
  }
  function handleSearch(params: Partial<LoginLogListQuery>) {
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
