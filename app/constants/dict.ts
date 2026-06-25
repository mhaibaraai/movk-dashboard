// 被业务页消费的字典类型键，集中维护避免魔法字符串
export const DICT_TYPE = {
  userSex: 'sys_user_sex',
  normalDisable: 'sys_normal_disable',
  userStatus: 'sys_user_status',
  menuType: 'sys_menu_type',
  noticeType: 'sys_notice_type',
  roleType: 'sys_role_type',
  dataScope: 'sys_data_scope',
  configType: 'sys_config_type',
  loginType: 'sys_login_type',
  businessStatus: 'sys_business_status'
} as const

export type DictTypeKey = typeof DICT_TYPE[keyof typeof DICT_TYPE]

// 列表 query 的 status 为 int：成功 1 / 失败 0（字典只存字符串枚举，查询转换保留在前端）
export const LOG_STATUS_QUERY: Record<string, number> = {
  SUCCESS: 1,
  FAILURE: 2
}

export const MENU_TYPE_ICON: Record<string, string> = {
  DIRECTORY: 'i-lucide-folder',
  MENU: 'i-lucide-file',
  BUTTON: 'i-lucide-square-mouse-pointer'
}
