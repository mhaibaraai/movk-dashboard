export interface MenuCreateReq {
  parentId?: string
  type: 'DIRECTORY' | 'MENU' | 'BUTTON'
  name: string
  orderNum?: number
  path?: string
  component?: string
  queryParams?: string
  isFrame?: boolean
  isCache?: boolean
  permissionCode?: string
  visible?: boolean
  status?: 'ENABLED' | 'DISABLED'
  icon?: string
  remark?: string
}

export type MenuUpdateReq = MenuCreateReq

export function useMenuApi() {
  const { $api } = useNuxtApp()

  return {
    create: (body: MenuCreateReq) =>
      $api<string>('/v1/system/menus', { method: 'POST', body }),

    update: (id: string, body: MenuUpdateReq) =>
      $api(`/v1/system/menus/${id}`, { method: 'PUT', body }),

    remove: (id: string) =>
      $api(`/v1/system/menus/${id}`, { method: 'DELETE' }),

    getById: (id: string) =>
      $api<MenuResp>(`/v1/system/menus/${id}`)
  }
}
