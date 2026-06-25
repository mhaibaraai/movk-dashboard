import { withQuery } from 'ufo'

export interface FileListQuery {
  originalName?: string
  category?: string
  contentType?: string
  page?: number
  size?: number
}

export function useFileApi() {
  const { $api } = useNuxtApp()

  return {
    // 批量上传走 useUploadWithProgress（需 URL），category 作为 query 参数
    uploadBatchUrl: (category?: string) =>
      withQuery('/v1/system/files/upload/batch', category ? { category } : {}),
    remove: (id: string) =>
      $api(`/v1/system/files/${id}`, { method: 'DELETE' }),
    removeBatch: (ids: string[]) =>
      $api('/v1/system/files/batch', { method: 'DELETE', body: ids }),
    getById: (id: string) =>
      $api<FileResp>(`/v1/system/files/${id}`),
    // 预览取原始二进制，跳过信封解包，用于图片内联展示
    preview: (id: string) =>
      $api<Blob>(`/v1/system/files/preview/${id}`, {
        responseType: 'blob',
        context: { toast: false, skipUnwrap: true, skipBusinessCheck: true }
      })
  }
}
