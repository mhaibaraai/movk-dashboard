export const USER_STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  ACTIVE: 'success',
  DISABLED: 'neutral',
  LOCKED: 'warning',
  DELETED: 'error'
}

export const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: '正常',
  DISABLED: '禁用',
  LOCKED: '锁定',
  DELETED: '已删除'
}

export const ENABLED_DISABLED_COLOR: Record<string, 'success' | 'neutral'> = {
  ENABLED: 'success',
  DISABLED: 'neutral'
}

export const ENABLED_DISABLED_LABEL: Record<string, string> = {
  ENABLED: '启用',
  DISABLED: '禁用'
}

export const USER_GENDER_LABEL: Record<string, string> = {
  UNKNOWN: '未知',
  MALE: '男',
  FEMALE: '女'
}

export const MENU_TYPE_LABEL: Record<string, string> = {
  DIRECTORY: '目录',
  MENU: '菜单',
  BUTTON: '按钮'
}

export const MENU_TYPE_COLOR: Record<string, 'primary' | 'info' | 'neutral'> = {
  DIRECTORY: 'primary',
  MENU: 'info',
  BUTTON: 'neutral'
}

export const MENU_TYPE_ICON: Record<string, string> = {
  DIRECTORY: 'i-lucide-folder',
  MENU: 'i-lucide-file',
  BUTTON: 'i-lucide-square-mouse-pointer'
}

export const CONFIG_TYPE_COLOR: Record<string, 'primary' | 'neutral'> = {
  BUILTIN: 'primary',
  CUSTOM: 'neutral'
}

export const CONFIG_TYPE_LABEL: Record<string, string> = {
  BUILTIN: '内置',
  CUSTOM: '自定义'
}
