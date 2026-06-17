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
            label: '岗位管理',
            icon: 'i-lucide-briefcase',
            to: '/system/post'
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
          },
          {
            label: '系统配置',
            icon: 'i-lucide-settings-2',
            to: '/system/config'
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

  const groups = navigation.map(group =>
    group.map(item =>
      item.children
        ? { ...item, children: item.children.map(({ icon: _icon, ...rest }) => rest) }
        : item
    )
  )

  function getLinks(id: string): NavigationMenuItem[] {
    return navigation.flat().find(item => item.to === `/${id}`)?.children ?? []
  }

  const systemLinks = getLinks('system')

  return { navigation, groups, systemLinks }
}
