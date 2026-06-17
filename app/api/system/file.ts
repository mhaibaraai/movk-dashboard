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
    remove: (id: string) =>
      $api(`/v1/system/files/${id}`, { method: 'DELETE' }),
    removeBatch: (ids: string[]) =>
      $api('/v1/system/files/batch', { method: 'DELETE', body: ids }),
    getById: (id: string) =>
      $api<FileResp>(`/v1/system/files/${id}`, { context: { toast: false } }),
    // 预览取原始二进制，跳过信封解包，用于图片内联展示
    preview: (id: string) =>
      $api<Blob>(`/v1/system/files/preview/${id}`, {
        responseType: 'blob',
        context: { toast: false, skipUnwrap: true }
      })
  }
}
