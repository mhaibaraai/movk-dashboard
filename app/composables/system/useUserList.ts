import { useUserApi } from '~/api/system/user'
import type { UserListQuery, UserCreateReq, UserUpdateReq, ResetPasswordReq } from '~/api/system/user'

export function useUserList() {
  const userApi = useUserApi()

  const query = ref<UserListQuery>({
    page: 0,
    size: 20
  })

  const { data, pending, refresh } = useApiFetch<PageResp<UserResp>>(
    '/v1/system/users',
    {
      query,
      watch: [query],
      toast: false
    }
  )

  const users = computed(() => data.value?.content ?? [])
  const total = computed(() => data.value?.totalElements ?? 0)

  async function handleDelete(id: string) {
    await userApi.remove(id)
    await refresh()
  }

  async function handleDeleteBatch(ids: string[]) {
    await userApi.removeBatch(ids)
    await refresh()
  }

  async function handleCreate(body: UserCreateReq) {
    await userApi.create(body)
    await refresh()
  }

  async function handleUpdate(id: string, body: UserUpdateReq) {
    await userApi.update(id, body)
    await refresh()
  }

  async function handleResetPassword(body: ResetPasswordReq) {
    await userApi.resetPassword(body)
  }

  async function getDetail(id: string) {
    return userApi.getById(id)
  }

  function handlePagination(page: number, size: number) {
    query.value = { ...query.value, page, size }
  }

  function handleSearch(params: Partial<UserListQuery>) {
    query.value = { ...query.value, ...params, page: 0 }
  }

  return {
    query: readonly(query),
    users,
    total,
    pending,
    refresh,
    handleDelete,
    handleDeleteBatch,
    handleCreate,
    handleUpdate,
    handleResetPassword,
    getDetail,
    handlePagination,
    handleSearch
  }
}
