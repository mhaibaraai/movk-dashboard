// 页面级权限校验，文件名晚于 cert.global 以确保登录态与 currentUser 已就绪
export default defineNuxtRouteMiddleware((to) => {
  // 常驻静态路由（public）无需 RBAC 校验
  if (to.meta.public) return

  const { accessiblePaths } = useNavigation()
  if (accessiblePaths.value.has(to.path)) return

  throw createError({ statusCode: 403, statusMessage: '无访问权限' })
})
