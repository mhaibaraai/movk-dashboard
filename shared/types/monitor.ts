// ─── 操作日志 ───────────────────────────────────────

export type LogStatus = 'SUCCESS' | 'FAILURE'

export interface OperateLogResp {
  id: number
  traceId: string | null
  userId: string | null
  username: string | null
  module: string | null
  operation: string | null
  method: string | null
  requestMethod: string | null
  requestUrl: string | null
  requestParams: string | null
  requestBody: string | null
  responseData: string | null
  userIp: string | null
  userAgent: string | null
  operationTime: number | null
  status: LogStatus
  errorMsg: string | null
  createdAt: string
}

export interface OperateLogListQuery {
  userId?: string
  module?: string
  operation?: string
  status?: number
  startTime?: string
  endTime?: string
  page?: number
  size?: number
}

// ─── 登录日志 ───────────────────────────────────────

export type LoginType = 'PASSWORD' | 'SMS' | 'OAUTH' | 'LOGOUT'

export interface LoginLogResp {
  id: number
  traceId: string | null
  userId: string | null
  username: string | null
  loginType: LoginType
  loginIp: string | null
  loginLocation: string | null
  browser: string | null
  os: string | null
  status: LogStatus
  message: string | null
  createdAt: string
}

export interface LoginLogListQuery {
  username?: string
  loginIp?: string
  status?: number
  startTime?: string
  endTime?: string
  page?: number
  size?: number
}

// ─── 在线用户 ───────────────────────────────────────

export interface OnlineUserResp {
  id: string
  userId: string
  username: string | null
  deviceInfo: string | null
  clientIp: string | null
  issuedAt: string
  expiresAt: string
  lastUsedAt: string
}

export interface OnlineUserListQuery {
  username?: string
  loginIp?: string
  page?: number
  size?: number
}
