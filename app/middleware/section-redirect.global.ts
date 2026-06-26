// section / 首页重定向：渲染前落到首个可用叶子菜单；侧栏 trigger 展开行为不受影响
export default defineNuxtRouteMiddleware((to) => {
  const { homeRoute, sectionRedirects } = useNavigation()

  // 首页 → 用户首个可用菜单（原 index.vue setup 逻辑收敛至此）
  if (to.path === '/') {
    if (homeRoute.value && homeRoute.value !== '/')
      return navigateTo(homeRoute.value, { replace: true })
    return
  }

  // 父级 section → 子树首个可达叶子
  const target = sectionRedirects.value.get(to.path)
  if (target && target !== to.path) return navigateTo(target, { replace: true })
})
