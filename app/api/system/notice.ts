export interface NoticeCreateReq {
  noticeTitle: string
  noticeType: 'NOTICE' | 'ANNOUNCEMENT'
  noticeContent?: string
  status?: 'ENABLED' | 'DISABLED'
}

export type NoticeUpdateReq = NoticeCreateReq

export interface NoticeListQuery {
  page?: number
  size?: number
  sort?: string[]
}

export function useNoticeApi() {
  const { $api } = useNuxtApp()

  return {
    getList: (query: NoticeListQuery) =>
      $api<PageResp<NoticeResp>>('/v1/system/notices', { query, context: { toast: false } }),
    create: (body: NoticeCreateReq) =>
      $api<string>('/v1/system/notices', { method: 'POST', body }),
    update: (id: string, body: NoticeUpdateReq) =>
      $api(`/v1/system/notices/${id}`, { method: 'PUT', body }),
    remove: (id: string) =>
      $api(`/v1/system/notices/${id}`, { method: 'DELETE' }),
    getById: (id: string) =>
      $api<NoticeResp>(`/v1/system/notices/${id}`)
  }
}
