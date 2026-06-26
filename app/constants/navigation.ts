import type { NavigationMenuItem } from '@nuxt/ui'

// 前端自有、需进侧栏的静态菜单（置于动态菜单之前）。新增公开页只需追加一条
export const STATIC_MENUS: NavigationMenuItem[] = [
  {
    label: '工作台',
    icon: 'i-lucide-layout-dashboard',
    to: '/'
  }
]

// 底部固定入口（非业务菜单，不随权限变化）
export const BOTTOM_MENUS: NavigationMenuItem[] = [
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

// 静态路由路径集合，供 accessiblePaths 合并与首页快捷入口去重复用
export const STATIC_PATHS: Set<string> = new Set(
  STATIC_MENUS.map(menu => menu.to).filter((path): path is string => typeof path === 'string')
)
