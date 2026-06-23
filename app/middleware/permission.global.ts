import { ROUTE_PERMISSIONS } from '~/constants/permission'

// 页面级权限校验，文件名晚于 cert.global 以确保登录态与 currentUser 已就绪
export default defineNuxtRouteMiddleware((to) => {
  // to.meta 覆盖优先，回退到集中映射表
  const permission = to.meta.permission ?? ROUTE_PERMISSIONS[to.path]
  const roles = to.meta.roles
  if (!permission && !roles) return

  const { hasPermission, hasRole } = usePermission()
  const allowed = (!permission || hasPermission(permission)) && (!roles || hasRole(roles))
  if (allowed) return

  throw createError({ statusCode: 403, statusMessage: '无访问权限' })
})
