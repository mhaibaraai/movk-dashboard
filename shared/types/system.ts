// ─── 用户管理 ───────────────────────────────────────

import type { SemanticColor } from '@movk/nuxt'

export interface UserResp {
  id: string
  username: string
  nickname: string | null
  email: string | null
  phone: string | null
  gender: string
  avatar: string | null
  status: string
  deptId: string | null
  deptName: string | null
  loginIp: string | null
  loginDate: string | null
  remark: string | null
  createdAt: string
  updatedAt: string
}

export interface UserDetailResp extends UserResp {
  roleIds: string[]
  roleCodes: string[]
  roleNames: string[]
  postIds: string[]
  postCodes: string[]
  postNames: string[]
}

// ─── 角色管理 ───────────────────────────────────────

export interface RoleResp {
  id: string
  code: string
  name: string
  roleSort: number
  dataScope: string
  dataScopeDeptIds: string[]
  dataScopeDeptNames: string[]
  status: string
  roleType: string
  menuIds: string[]
  remark: string | null
  createdAt: string
  updatedAt: string
}

// ─── 菜单管理 ───────────────────────────────────────

export interface MenuResp {
  id: string
  parentId: string | null
  type: string
  name: string
  orderNum: number
  path: string | null
  component: string | null
  queryParams: string | null
  isFrame: boolean
  isCache: boolean
  permissionCode: string | null
  visible: boolean
  status: string
  icon: string | null
  remark: string | null
  createdAt: string
  updatedAt: string
  children?: MenuResp[]
}

// 当前用户路由菜单树（/v1/auth/me 的 menus 与 /menus/user/routes），仅含可导航的 DIRECTORY/MENU 节点
export interface MenuTreeResp {
  id: string
  parentId: string | null
  name: string
  path: string | null
  component: string | null
  icon: string | null
  visible: boolean
  orderNum: number
  children?: MenuTreeResp[]
}

// ─── 部门管理 ───────────────────────────────────────

export interface DeptResp {
  id: string
  parentId: string | null
  deptName: string
  deptCode: string | null
  orderNum: number
  leaderUserId: string | null
  leaderUserName: string | null
  phone: string | null
  email: string | null
  status: string
  createdAt: string
  updatedAt: string
  children?: DeptResp[]
}

// ─── 岗位管理 ───────────────────────────────────────

export interface PostResp {
  id: string
  postCode: string
  postName: string
  orderNum: number
  status: string
  remark: string | null
  createdAt: string
  updatedAt: string
}

// ─── 字典管理 ───────────────────────────────────────

export interface DictTypeResp {
  id: string
  dictName: string
  dictType: string
  status: string
  remark: string | null
  createdAt: string
  updatedAt: string
}

export interface DictDataResp {
  id: string
  dictType: string
  dictLabel: string
  dictValue: string
  dictSort: number
  cssClass: string | null
  listClass: SemanticColor | null
  isDefault: boolean
  status: string
  remark: string | null
  createdAt: string
  updatedAt: string
}

// ─── 文件管理 ───────────────────────────────────────

export interface FileResp {
  id: string
  originalName: string
  storageName: string
  extension: string | null
  contentType: string | null
  size: number
  sizeFormatted: string
  path: string | null
  md5: string | null
  storageType: string | null
  category: string | null
  downloadUrl: string | null
  createdAt: string
  remark: string | null
}

export interface FileUploadResp {
  id: string
  originalName: string
  storageName: string
  size: number
  contentType: string
  downloadUrl: string
  md5: string
}

// ─── 系统配置 ───────────────────────────────────────

export interface ConfigResp {
  id: string
  configName: string
  configKey: string
  configValue: string
  configType: string
  remark: string | null
  createdAt: string
  updatedAt: string
}

// ─── 通知公告 ───────────────────────────────────────

export interface NoticeResp {
  id: string
  noticeTitle: string
  noticeType: string
  noticeContent: string | null
  status: string
  creator: string | null
  createdAt: string
  updatedAt: string
}
