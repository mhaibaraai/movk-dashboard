export interface ConfigCreateReq {
  configName: string
  configKey: string
  configValue?: string
  configType?: ConfigType
  remark?: string
}

export interface ConfigUpdateReq {
  configName: string
  configKey: string
  configValue?: string
  configType?: ConfigType
  remark?: string
}

export function useConfigApi() {
  const { $api } = useNuxtApp()

  return {
    getList: () =>
      $api<ConfigResp[]>('/v1/system/configs', { context: { toast: false } }),

    create: (body: ConfigCreateReq) =>
      $api<string>('/v1/system/configs', { method: 'POST', body }),

    update: (id: string, body: ConfigUpdateReq) =>
      $api(`/v1/system/configs/${id}`, { method: 'PUT', body }),

    remove: (id: string) =>
      $api(`/v1/system/configs/${id}`, { method: 'DELETE' }),

    getById: (id: string) =>
      $api<ConfigResp>(`/v1/system/configs/${id}`),

    refreshCache: () =>
      $api('/v1/system/configs/refresh-cache', { method: 'POST' })
  }
}
