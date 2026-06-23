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

export function useNavigation() {
  const { currentUser } = useCurrentUser()

  // 主导航由当前用户的路由菜单树（/v1/auth/me 的 menus）动态生成，层级随后端配置
  const mainNavigation = computed<NavigationMenuItem[]>(() => {
    const menus = (currentUser.value?.menus ?? []) as MenuTreeResp[]
    const visibleMenus = Tree.filter(menus, ({ node }) => node.visible !== false)
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

  return { navigation, groups, getSectionLinks }
}
