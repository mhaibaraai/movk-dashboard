import { usePostApi } from '~/api/system/post'
import type { PostListQuery, PostCreateReq, PostUpdateReq } from '~/api/system/post'

export function usePostList() {
  const postApi = usePostApi()

  const query = ref<PostListQuery>({
    page: 0,
    size: 10
  })

  const { data, pending, refresh } = useApiFetch<PageResp<PostResp>>(
    '/v1/system/posts',
    {
      query,
      watch: [query],
      toast: false
    }
  )

  const posts = computed(() => data.value?.content ?? [])
  const total = computed(() => data.value?.page?.totalElements ?? 0)

  async function handleCreate(body: PostCreateReq) {
    await postApi.create(body)
    await refresh()
  }

  async function handleUpdate(id: string, body: PostUpdateReq) {
    await postApi.update(id, body)
    await refresh()
  }

  async function handleDelete(id: string) {
    await postApi.remove(id)
    await refresh()
  }

  async function getDetail(id: string) {
    return postApi.getById(id)
  }

  function handlePagination(page: number, size: number) {
    query.value = { ...query.value, page, size }
  }

  function handleSearch(params: Partial<PostListQuery>) {
    query.value = { ...query.value, ...params, page: 0 }
  }

  return {
    query: readonly(query),
    posts,
    total,
    pending,
    refresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    getDetail,
    handlePagination,
    handleSearch
  }
}
