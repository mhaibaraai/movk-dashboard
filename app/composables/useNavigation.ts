import type { NavigationMenuItem } from '@nuxt/ui'
import { Tree } from '@movk/core'
import { BOTTOM_MENUS, STATIC_MENUS, STATIC_PATHS } from '~/constants/navigation'

// 动态/参数路由不作为登录后落地首选
function hasRouteParams(path: string): boolean {
  return /[:*]/.test(path) || path.includes('[')
}

export function useNavigation() {
  const { currentUser } = useCurrentUser()

  // 菜单树单一来源：导航、访问白名单、落地路由共用
  const menus = computed<MenuTreeResp[]>(() => (currentUser.value?.menus ?? []) as MenuTreeResp[])

  // 可访问路径白名单：静态路由 + 全部菜单 path（visible 仅控显隐，不等于不可访问，隐藏页仍可直达）
  const accessiblePaths = computed<Set<string>>(() => {
    const paths = Tree.toList(menus.value)
      .map(node => node.path)
      .filter((path): path is string => Boolean(path))
    return new Set([...STATIC_PATHS, ...paths])
  })

  // 登录后落地：合并导航首项 —— 静态首项优先，回退到后端首个可见叶子（非目录、非参数路由），前序 DFS 取首位
  const homeRoute = computed<string | undefined>(() => {
    const staticFirst = STATIC_MENUS.find(menu =>
      typeof menu.to === 'string' && !hasRouteParams(menu.to))?.to as string | undefined
    if (staticFirst) return staticFirst

    const flat = Tree.toList(menus.value)
    const parentIds = new Set(flat.map(node => node.parentId).filter(Boolean))
    return flat.find(node =>
      node.path
      && node.visible !== false
      && !parentIds.has(node.id)
      && !hasRouteParams(node.path)
    )?.path ?? undefined
  })

  // 父级 path → 子树首个可达叶子 path（供中间件做 section 重定向）
  const sectionRedirects = computed<Map<string, string>>(() => {
    const result = new Map<string, string>()
    Tree.forEach(menus.value, ({ node }) => {
      if (!node.path || !node.children?.length) return // 仅父级节点
      const leaf = Tree.find(node.children, ({ node: n }) =>
        !n.children?.length && !!n.path && n.visible !== false && !hasRouteParams(n.path))
      if (leaf?.path && leaf.path !== node.path) result.set(node.path, leaf.path)
    })
    return result
  })

  // 主导航由当前用户的路由菜单树（/v1/auth/me 的 menus）动态生成，层级随后端配置
  const mainNavigation = computed<NavigationMenuItem[]>(() => {
    const visibleMenus = Tree.filter(menus.value, ({ node }) => node.visible !== false)
    return Tree.transform<MenuTreeResp, NavigationMenuItem>(visibleMenus, ({ node, depth }) => {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0
      return {
        label: node.name,
        icon: node.icon ?? undefined,
        to: node.path ?? undefined,
        ...(hasChildren ? { type: 'trigger' as const, defaultOpen: depth === 0 } : {})
      }
    }) as NavigationMenuItem[]
  })

  const navigation = computed<NavigationMenuItem[][]>(() => [[...STATIC_MENUS, ...mainNavigation.value], BOTTOM_MENUS])

  // 侧边栏：去掉子项图标，保持与原视觉一致
  const groups = computed<NavigationMenuItem[][]>(() =>
    navigation.value.map(group =>
      group.map(item =>
        item.children
          ? { ...item, children: item.children.map(({ icon: _icon, ...rest }) => rest) }
          : item
      )
    )
  )

  // 按顶级路径取其子项，供 section 父页面（system / monitor 等）渲染二级导航
  function getSectionLinks(basePath: string): NavigationMenuItem[] {
    return mainNavigation.value.find(item => item.to === basePath)?.children ?? []
  }

  return { navigation, groups, getSectionLinks, accessiblePaths, homeRoute, sectionRedirects }
}
