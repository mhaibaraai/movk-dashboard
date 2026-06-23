export interface PostCreateReq {
  postCode: string
  postName: string
  orderNum?: number
  status?: 'ENABLED' | 'DISABLED'
  remark?: string
}

export interface PostUpdateReq {
  postName: string
  orderNum?: number
  status?: 'ENABLED' | 'DISABLED'
  remark?: string
}

export interface PostListQuery {
  postCode?: string
  postName?: string
  status?: 'ENABLED' | 'DISABLED'
  createdAtStart?: string
  createdAtEnd?: string
  page?: number
  size?: number
}

export function usePostApi() {
  const { $api } = useNuxtApp()

  return {
    create: (body: PostCreateReq) =>
      $api<string>('/v1/system/posts', { method: 'POST', body }),

    update: (id: string, body: PostUpdateReq) =>
      $api(`/v1/system/posts/${id}`, { method: 'PUT', body }),

    remove: (id: string) =>
      $api(`/v1/system/posts/${id}`, { method: 'DELETE' }),

    getById: (id: string) =>
      $api<PostResp>(`/v1/system/posts/${id}`, { context: { toast: false } })
  }
}
