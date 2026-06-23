export default defineNuxtRouteMiddleware(async (to) => {
  const { isHydrating, payload } = useNuxtApp()
  if (import.meta.client && isHydrating && payload.serverRendered) return

  const { cert } = useRuntimeConfig().public
  if (!cert.enabled) return

  const { session, clear: clearSession, loggedIn } = useUserSession()
  const { currentUser, fetchCurrentUser, clearCurrentUser } = useCurrentUser()
  const { refreshSession } = useSessionRefresh()
  const path = to.path

  async function redirectToLogin() {
    await clearSession()
    clearCurrentUser()
    return navigateTo(cert.loginPath)
  }

  // 已登录用户访问登录页 → 重定向首页
  if (loggedIn.value && path === cert.loginPath) return navigateTo('/')

  // 公开路由放行（loginPath 自动包含）
  const isPublic = [cert.loginPath, ...(cert.publicRoutes || [])].some((route: string) =>
    route.endsWith('/*')
      ? path.startsWith(route.slice(0, -2))
      : path === route
  )
  if (isPublic) return

  // 未登录用户 → 重定向登录页
  if (!session.value?.jwt) return navigateTo(cert.loginPath)

  const { expires_at, refresh_expires_at, refresh_token } = session.value.jwt

  if (isExpired(expires_at) && isExpired(refresh_expires_at)) {
    return redirectToLogin()
  } else if (isExpired(expires_at)) {
    try {
      await refreshSession(refresh_token)
    } catch {
      return redirectToLogin()
    }
  }

  // 用户已认证，确保 currentUser 已填充（页面刷新场景）
  // 本地 session 未过期但后端已判 token 失效时，/v1/auth/me 会抛错，统一清除并跳转登录
  if (!currentUser.value) {
    try {
      await fetchCurrentUser()
    } catch {
      return redirectToLogin()
    }
  }
})
