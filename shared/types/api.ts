// 通用分页响应（Spring Data PagedModel：内容 + page 元信息）
export interface PageResp<T> {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}
