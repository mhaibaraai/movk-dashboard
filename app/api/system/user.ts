export interface UserCreateReq {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  gender?: 'UNKNOWN' | 'MALE' | 'FEMALE'
  avatar?: string
  status?: 'ACTIVE' | 'DISABLED' | 'LOCKED' | 'DELETED'
  deptId?: string
  roleIds?: string[]
  postIds?: string[]
  remark?: string
}

export interface UserUpdateReq {
  nickname?: string
  email?: string
  phone?: string
  gender?: 'UNKNOWN' | 'MALE' | 'FEMALE'
  avatar?: string
  status?: 'ACTIVE' | 'DISABLED' | 'LOCKED' | 'DELETED'
  deptId?: string
  roleIds?: string[]
  postIds?: string[]
  remark?: string
}

export interface ResetPasswordReq {
  userId: string
  newPassword: string
}

export interface UserListQuery {
  username?: string
  nickname?: string
  phone?: string
  email?: string
  status?: 'ACTIVE' | 'DISABLED' | 'LOCKED' | 'DELETED'
  deptId?: string
  createdAtStart?: string
  createdAtEnd?: string
  page?: number
  size?: number
}

export function useUserApi() {
  const { $api } = useNuxtApp()

  return {
    create: (body: UserCreateReq) =>
      $api<string>('/v1/system/users', { method: 'POST', body }),

    update: (id: string, body: UserUpdateReq) =>
      $api(`/v1/system/users/${id}`, { method: 'PUT', body }),

    remove: (id: string) =>
      $api(`/v1/system/users/${id}`, { method: 'DELETE' }),

    removeBatch: (ids: string[]) =>
      $api('/v1/system/users', { method: 'DELETE', body: ids }),

    resetPassword: (body: ResetPasswordReq) =>
      $api('/v1/system/users/reset-password', { method: 'PUT', body }),

    getById: (id: string) =>
      $api<UserDetailResp>(`/v1/system/users/${id}`),

    assignRoles: (userId: string, roleIds: string[]) =>
      $api(`/v1/system/users/${userId}/roles`, { method: 'POST', body: roleIds }),

    assignPosts: (userId: string, postIds: string[]) =>
      $api(`/v1/system/users/${userId}/posts`, { method: 'POST', body: postIds })
  }
}
