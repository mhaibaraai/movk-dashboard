export const LOG_STATUS_COLOR: Record<string, 'success' | 'error'> = {
  SUCCESS: 'success',
  FAILURE: 'error'
}

export const LOG_STATUS_LABEL: Record<string, string> = {
  SUCCESS: '成功',
  FAILURE: '失败'
}

// 列表 query 的 status 为 int：成功 1 / 失败 0
export const LOG_STATUS_QUERY: Record<string, number> = {
  SUCCESS: 1,
  FAILURE: 0
}

export const LOGIN_TYPE_LABEL: Record<string, string> = {
  PASSWORD: '密码',
  SMS: '短信',
  OAUTH: '第三方',
  LOGOUT: '登出'
}

export const LOGIN_TYPE_COLOR: Record<string, 'primary' | 'info' | 'success' | 'neutral'> = {
  PASSWORD: 'primary',
  SMS: 'info',
  OAUTH: 'success',
  LOGOUT: 'neutral'
}
