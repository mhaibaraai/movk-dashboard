import type { NavigationMenuItem } from '@nuxt/ui'
import { Tree } from '@movk/core'

// 底部固定入口（非业务菜单，不随权限变化）
const bottomGroup: NavigationMenuItem[] = [
  {
    label: '反馈',
    icon: 'i-lucide-message-circle',
    to: 'https://github.com/mhaibaraai/movk-nuxt-dashboard',
    target: '_blank'
  },
  {
    label: '帮助与支持',
    icon: 'i-lucide-info',
    to: 'https://github.com/mhaibaraai/movk-nuxt-dashboard',
    target: '_blank'
  }
]

// 动态/参数路由不作为登录后落地首选
function hasRouteParams(path: string): boolean {
  return /[:*]/.test(path) || path.includes('[')
}

export function useNavigation() {
  const { currentUser } = useCurrentUser()

  // 菜单树单一来源：导航、访问白名单、落地路由共用
  const menus = computed<MenuTreeResp[]>(() => (currentUser.value?.menus ?? []) as MenuTreeResp[])

  // 可访问路径白名单：取全部菜单 path（visible 仅控显隐，不等于不可访问，隐藏页仍可直达）
  const accessiblePaths = computed<Set<string>>(() => {
    const paths = Tree.toList(menus.value)
      .map(node => node.path)
      .filter((path): path is string => Boolean(path))
    return new Set(paths)
  })

  // 登录后落地：首个可见叶子菜单（非目录、非参数路由），前序 DFS 取首位
  const homeRoute = computed<string | undefined>(() => {
    const flat = Tree.toList(menus.value)
    const parentIds = new Set(flat.map(node => node.parentId).filter(Boolean))
    return flat.find(node =>
      node.path
      && node.visible !== false
      && !parentIds.has(node.id)
      && !hasRouteParams(node.path)
    )?.path ?? undefined
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

  const navigation = computed<NavigationMenuItem[][]>(() => [mainNavigation.value, bottomGroup])

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

  return { navigation, groups, getSectionLinks, accessiblePaths, homeRoute }
}
