// 页面级访问声明：definePageMeta({ access })，由 01.cert / 02.permission 中间件消费。
// 路由级访问以菜单树 accessiblePaths（useNavigation）为准；权限/角色代码用于元素级 v-permission / v-role 指令，不在路由 meta 表达。
interface PagePermissionMeta {
  /** 访问策略：'public' 免登录免 RBAC；'authed' 需登录免 RBAC；缺省需登录 + 路径白名单 */
  access?: 'public' | 'authed'
}

declare module '#app' {
  interface PageMeta extends PagePermissionMeta {}
}

declare module 'vue-router' {
  interface RouteMeta extends PagePermissionMeta {}
}

export {}
