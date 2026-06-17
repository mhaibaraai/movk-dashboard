import { useOnlineUserApi } from '~/api/monitor/online-user'

export function useOnlineUserList() {
  const onlineUserApi = useOnlineUserApi()

  const query = ref<OnlineUserListQuery>({ page: 0, size: 20 })

  const { data, pending, refresh } = useApiFetch<PageResp<OnlineUserResp>>('/v1/monitor/online-users', {
    query,
    watch: [query],
    toast: false
  })

  const onlineUsers = computed(() => data.value?.content ?? [])
  const total = computed(() => data.value?.totalElements ?? 0)

  async function handleForceLogout(tokenId: string) {
    await onlineUserApi.forceLogoutSession(tokenId)
    await refresh()
  }
  async function handleBatchForceLogout(tokenIds: string[]) {
    await onlineUserApi.batchForceLogout(tokenIds)
    await refresh()
  }

  function handlePagination(page: number, size: number) {
    query.value = { ...query.value, page, size }
  }
  function handleSearch(params: Partial<OnlineUserListQuery>) {
    query.value = { ...query.value, ...params, page: 0 }
  }

  return {
    query: readonly(query),
    onlineUsers,
    total,
    pending,
    refresh,
    handleForceLogout,
    handleBatchForceLogout,
    handlePagination,
    handleSearch
  }
}
