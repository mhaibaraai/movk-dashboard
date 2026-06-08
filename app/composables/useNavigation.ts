import type { NavigationMenuItem } from '@nuxt/ui'

export function useNavigation() {
  const navigation: NavigationMenuItem[][] = [
    [
      {
        label: '首页',
        icon: 'i-lucide-house',
        to: '/'
      },
      {
        label: '系统管理',
        icon: 'i-lucide-cog',
        to: '/system',
        type: 'trigger',
        defaultOpen: true,
        children: [
          {
            label: '用户管理',
            icon: 'i-lucide-users',
            to: '/system/user'
          },
          {
            label: '角色管理',
            icon: 'i-lucide-shield-check',
            to: '/system/role'
          },
          {
            label: '部门管理',
            icon: 'i-lucide-building-2',
            to: '/system/dept'
          },
          {
            label: '菜单管理',
            icon: 'i-lucide-layout-list',
            to: '/system/menu'
          }
        ]
      }
    ],
    [
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
  ]

  const systemLinks = computed<NavigationMenuItem[]>(() =>
    navigation.flat().find(item => item.to === '/system')?.children ?? []
  )

  return { navigation, systemLinks }
}
