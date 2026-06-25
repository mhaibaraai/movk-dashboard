export interface RoleCreateReq {
  code: string
  name: string
  roleSort?: number
  dataScope?: string
  dataScopeDeptIds?: string[]
  status?: string
  roleType?: string
  menuIds?: string[]
  remark?: string
}

export interface RoleUpdateReq {
  name?: string
  roleSort?: number
  dataScope?: string
  dataScopeDeptIds?: string[]
  status?: string
  roleType?: string
  menuIds?: string[]
  remark?: string
}

export interface RoleListQuery {
  code?: string
  name?: string
  status?: string
  roleType?: string
  createdAtStart?: string
  createdAtEnd?: string
  page?: number
  size?: number
}

export function useRoleApi() {
  const { $api } = useNuxtApp()

  return {
    create: (body: RoleCreateReq) =>
      $api<string>('/v1/system/roles', { method: 'POST', body }),

    update: (id: string, body: RoleUpdateReq) =>
      $api(`/v1/system/roles/${id}`, { method: 'PUT', body }),

    remove: (id: string) =>
      $api(`/v1/system/roles/${id}`, { method: 'DELETE' }),

    removeBatch: (ids: string[]) =>
      $api('/v1/system/roles', { method: 'DELETE', body: ids }),

    getById: (id: string) =>
      $api<RoleResp>(`/v1/system/roles/${id}`),

    assignMenus: (roleId: string, menuIds: string[]) =>
      $api(`/v1/system/roles/${roleId}/menus`, { method: 'POST', body: menuIds })
  }
}
