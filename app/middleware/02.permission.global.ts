// 页面级权限校验，序号 02，在 01.cert 之后执行，确保登录态与 currentUser 已就绪
export default defineNuxtRouteMiddleware((to) => {
  // 免 RBAC 页面放行（access: 'public' 免登录、'authed' 需登录但非菜单页）
  if (to.meta.access === 'public' || to.meta.access === 'authed') return

  const { accessiblePaths } = useNavigation()
  if (accessiblePaths.value.has(to.path)) return

  throw createError({ statusCode: 403, statusMessage: '无访问权限' })
})
