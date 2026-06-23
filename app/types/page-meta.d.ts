// 页面级权限声明：definePageMeta({ permission, roles })，由 permission.global 中间件消费
interface PagePermissionMeta {
  /** 访问该页所需权限标识，数组为「任一命中」 */
  permission?: string | string[]
  /** 访问该页所需角色编码，数组为「任一命中」 */
  roles?: string | string[]
}

declare module '#app' {
  interface PageMeta extends PagePermissionMeta {}
}

declare module 'vue-router' {
  interface RouteMeta extends PagePermissionMeta {}
}

export {}
