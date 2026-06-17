import { usePostApi } from '~/api/system/post'
import type { PostCreateReq, PostUpdateReq } from '~/api/system/post'

export function usePostList() {
  const postApi = usePostApi()

  // /posts 返回全量列表（非分页）
  const { data, pending, refresh } = useApiFetch<PostResp[]>('/v1/system/posts', {
    toast: false
  })

  const posts = computed(() => data.value ?? [])

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

  return {
    posts,
    pending,
    refresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    getDetail
  }
}
