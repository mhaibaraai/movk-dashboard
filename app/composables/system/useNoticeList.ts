import { useNoticeApi } from '~/api/system/notice'
import type { NoticeCreateReq, NoticeUpdateReq } from '~/api/system/notice'

export function useNoticeList() {
  const noticeApi = useNoticeApi()

  // 后端列表无业务 query，仅 page/size/sort：一次拉取后客户端过滤 + 分页
  const { data, pending, refresh } = useApiFetch<PageResp<NoticeResp>>('/v1/system/notices', {
    query: { page: 0, size: 200, sort: ['createdAt,desc'] },
    toast: false
  })

  const notices = computed(() => data.value?.content ?? [])

  async function handleCreate(body: NoticeCreateReq) {
    await noticeApi.create(body)
    await refresh()
  }
  async function handleUpdate(id: string, body: NoticeUpdateReq) {
    await noticeApi.update(id, body)
    await refresh()
  }
  async function handleDelete(id: string) {
    await noticeApi.remove(id)
    await refresh()
  }
  async function handleDeleteBatch(ids: string[]) {
    await Promise.all(ids.map(id => noticeApi.remove(id)))
    await refresh()
  }
  async function getDetail(id: string) {
    return noticeApi.getById(id)
  }

  return {
    notices,
    pending,
    refresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDeleteBatch,
    getDetail
  }
}
