export interface DictTypeCreateReq {
  dictName: string
  dictType: string
  status?: 'ENABLED' | 'DISABLED'
  remark?: string
}

export type DictTypeUpdateReq = DictTypeCreateReq

export interface DictDataCreateReq {
  dictType: string
  dictLabel: string
  dictValue: string
  dictSort?: number
  cssClass?: string
  listClass?: string
  isDefault?: boolean
  status?: 'ENABLED' | 'DISABLED'
  remark?: string
}

export type DictDataUpdateReq = DictDataCreateReq

export function useDictApi() {
  const { $api } = useNuxtApp()

  return {
    getTypeList: () =>
      $api<DictTypeResp[]>('/v1/system/dicts/types', { context: { toast: false } }),
    createType: (body: DictTypeCreateReq) =>
      $api<string>('/v1/system/dicts/types', { method: 'POST', body }),
    updateType: (id: string, body: DictTypeUpdateReq) =>
      $api(`/v1/system/dicts/types/${id}`, { method: 'PUT', body }),
    removeType: (id: string) =>
      $api(`/v1/system/dicts/types/${id}`, { method: 'DELETE' }),
    getTypeById: (id: string) =>
      $api<DictTypeResp>(`/v1/system/dicts/types/${id}`),

    getDataByType: (dictType: string) =>
      $api<DictDataResp[]>('/v1/system/dicts/data', { query: { dictType }, context: { toast: false } }),
    createData: (body: DictDataCreateReq) =>
      $api<string>('/v1/system/dicts/data', { method: 'POST', body }),
    updateData: (id: string, body: DictDataUpdateReq) =>
      $api(`/v1/system/dicts/data/${id}`, { method: 'PUT', body }),
    removeData: (id: string) =>
      $api(`/v1/system/dicts/data/${id}`, { method: 'DELETE' }),
    getDataById: (id: string) =>
      $api<DictDataResp>(`/v1/system/dicts/data/${id}`),

    refreshCache: () =>
      $api('/v1/system/dicts/refresh-cache', { method: 'POST' })
  }
}
