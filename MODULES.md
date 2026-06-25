# 系统模块设计

本文档是 Movk Dashboard 全部业务模块的统一需求与设计基准，依据后端 `MovkRBACAPI`（OpenAPI v1.0.0）重新调研编写。实现层的分层、列 / 搜索 / 表单约定与 CRUD 配方见根目录 [AGENTS.md](./AGENTS.md)，本文不重复，只给出每个模块的端点、类型、UI 设计与边界。

## 域与模块清单

后端分两个业务域：`system`（系统管理）与 `monitor`（系统监控）。

| 域 | 模块 | 数据形态 | 状态 |
| --- | --- | --- | --- |
| system | [用户管理 user](#用户管理-user) | 分页 | 已实现 |
| system | [角色管理 role](#角色管理-role) | 分页 | 已实现 |
| system | [菜单管理 menu](#菜单管理-menu) | 树 | 已实现 |
| system | [部门管理 dept](#部门管理-dept) | 树 | 已实现 |
| system | [岗位管理 post](#岗位管理-post) | 全量 list | 已实现 |
| system | [字典管理 dict](#字典管理-dict) | 主从双 list | 已实现 |
| system | [系统配置 config](#系统配置-config) | 全量 list | 已实现 |
| system | [通知公告 notice](#通知公告-notice) | 分页 | 已实现 |
| system | [文件管理 file](#文件管理-file) | 分页 | 已实现 |
| monitor | [操作日志 operate-log](#操作日志-operate-log) | 分页（只读） | 已实现 |
| monitor | [登录日志 login-log](#登录日志-login-log) | 分页（只读） | 已实现 |
| monitor | [在线用户 online-user](#在线用户-online-user) | 分页 | 已实现 |

建议落地顺序：config → dict → notice → file（system 补全）→ monitor 域搭建（operate-log → login-log → online-user）。

## 通用约定

仅列与 [AGENTS.md](./AGENTS.md) 配合时易踩的点，细节以 AGENTS.md 为准。

- 响应信封 `R<T>` 由 `$api` / `useApiFetch` 自动解包，业务代码直接拿 `T`。
- 三种数据形态：
  - **分页** `PageResp<T> = { content, totalElements, totalPages, number, size, first, last }`，`page` 从 0 开始；列表用 `useApiFetch<PageResp<T>>(url, { query, watch:[query], toast:false })`。
  - **全量 list**（后端无分页 / 无 query，如 post / config / dict）：一次取全量，搜索走客户端过滤（`appliedSearch` + `computed`）。
  - **树**（menu / dept）：取 `/tree` 端点，用 `@movk/core` 的 `Tree` 扁平化 / 查找。
- 读操作一律 `{ toast: false }`（列表、`getById`、`tree`、`children-ids`、`key/{x}` 等）；写操作（增删改、刷新缓存、强制下线、清理日志）保留默认提示。
- 列表页一律用 `AppDataTable`（封装 `MDataTable` + 工具栏 + 列显隐 + `resizable`），分页用 `useTablePagination`。
- 类型落 `shared/types/system.ts`（各实体 `Resp`）与 `app/api/system|monitor/<resource>.ts`（`CreateReq` / `UpdateReq` / `ListQuery`），状态 / 类型的颜色与标签集中在 `app/constants/system.ts`。

## 跨模块关系

| 关系 | 说明 |
| --- | --- |
| user → dept | 用户归属部门 `deptId`，列表左侧部门树过滤 |
| user → role | 用户分配角色 `roleIds`（`POST users/{userId}/roles`） |
| user → post | 用户分配岗位 `postIds`（`POST users/{userId}/posts`） |
| role → menu | 角色分配菜单权限 `menuIds`（`POST roles/{roleId}/menus`） |
| role → dept | `dataScope=CUSTOM` 时自定义数据范围部门 `dataScopeDeptIds` |
| menu → menu | 自身树（`parentId` / `children`），类型 DIRECTORY/MENU/BUTTON 层级约束 |
| dept → dept | 自身树（`parentId` / `children`），删除前查 `children-ids` |
| dict 类型 → dict 数据 | 主从，数据按 `dictType` 关联 |
| 日志 / 在线用户 → user | 通过 `userId` / `username` 关联操作者 |

## 系统管理 system

### 用户管理 user

数据形态：分页 `PageResp<UserResp>`。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/users` | GET | 分页列表（query：username / nickname / phone / email / status / deptId / createdAtStart·End / page / size） |
| `/v1/system/users` | POST | 新增 |
| `/v1/system/users` | DELETE | 批量删除（body：id 数组） |
| `/v1/system/users/{id}` | GET / PUT / DELETE | 详情 / 修改 / 删除 |
| `/v1/system/users/reset-password` | PUT | 重置密码（body：`{ userId, newPassword }`） |
| `/v1/system/users/{userId}/roles` | POST | 分配角色（body：roleId 数组） |
| `/v1/system/users/{userId}/posts` | POST | 分配岗位（body：postId 数组） |

类型：`UserResp` / `UserDetailResp`（含 roleIds·codes·names、postIds·codes·names）、`UserCreateReq`（含 password）、`UserUpdateReq`（无 username / password）、`ResetPasswordReq`、`UserListQuery`。`UserStatus = ACTIVE | DISABLED | LOCKED | DELETED`，`UserGender = UNKNOWN | MALE | FEMALE`。

- 列：selection（左固定） · username · nickname · phone · email（`tooltip` + size） · deptName · status（badge） · createdAt · actions（右固定：编辑 / 删除 / 重置密码）。
- 搜索（`:cols="4"`）：username、nickname、phone、status（selectMenu，含 DELETED）；部门由左侧部门树承担。
- 表单（`USlideover` + `MAutoForm`）：username（编辑禁用，函数式 `controlProps`）、password（`meta.if: () => !isEditing`）、nickname、email、phone、gender、status、deptId / roleIds / postIds（动态选项，函数式 `controlProps`）、remark。
- 特有动作：重置密码（独立 `UModal` + `MAutoForm`）；左侧部门树过滤（`@toggle.prevent` 只过滤不折叠）。
- 边界：username 不可改；`DELETED` 为软删状态。

参考实现：`app/pages/system/user.vue`、`app/composables/system/useUserList.ts`、`useUserFormOptions`。

### 角色管理 role

数据形态：分页 `PageResp<RoleResp>`。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/roles` | GET / POST / DELETE | 分页列表 / 新增 / 批删 |
| `/v1/system/roles/{id}` | GET / PUT / DELETE | 详情 / 修改 / 删除 |
| `/v1/system/roles/{roleId}/menus` | POST | 分配菜单权限（body：menuId 数组） |

类型：`RoleResp`、`RoleCreateReq`（含 code）、`RoleUpdateReq`（无 code）、`RoleListQuery`。`RoleStatus = ENABLED | DISABLED`，`RoleType = BUILT_IN | CUSTOM`，`DataScope = ALL | DEPT | DEPT_AND_CHILD | SELF | CUSTOM`。

- 列：selection（左） · code · name · roleType（badge：内置 / 自定义） · roleSort · status（badge） · createdAt · actions（右：编辑 / 分配菜单 / 删除）。
- 搜索（`:cols="5"`）：code、name、status、roleType。
- 表单：code（编辑禁用）、name、roleSort（number）、status、dataScope（enum）、dataScopeDeptIds（`meta.if: ({ state }) => state.dataScope === 'CUSTOM'`，多选部门）、remark。
- 特有动作：分配菜单（`USlideover` + `UTree` 多选 `multiple + propagate-select`；打开先 `getById` 回填 menuIds，确认调 `assignMenus`）。
- 边界：`BUILT_IN` 角色禁删、禁改 code。

### 菜单管理 menu

数据形态：树 `MenuResp[]`（`GET /v1/system/menus/tree`）。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/menus/tree` | GET | 菜单树 |
| `/v1/system/menus` | GET / POST | 列表 / 新增 |
| `/v1/system/menus/{id}` | GET / PUT / DELETE | 详情 / 修改 / 删除 |
| `/v1/system/menus/permissions/all` | GET | 所有权限标识 |
| `/v1/system/menus/user/routes` | GET | 当前用户路由（前端路由生成） |
| `/v1/system/menus/user/permissions` | GET | 当前用户权限标识 |
| `/v1/system/menus/user/buttons` | GET | 当前用户按钮权限 |
| `/v1/system/menus/user/buttons-by-menu` | GET | 按菜单分组的按钮权限 |

类型：`MenuResp`（含 `children?`）、`MenuCreateReq`、`MenuUpdateReq = MenuCreateReq`。`MenuType = DIRECTORY | MENU | BUTTON`，`MenuStatus = ENABLED | DISABLED`。

- 列（树表）：name（树展开列 + icon） · type（badge） · permissionCode · path · orderNum · visible（badge） · status（badge） · actions（右：新增子菜单 / 编辑 / 删除）。
- 表单（按 type 条件渲染 `meta.if`）：
  - 公共：parentId（树选择）、type（先选）、name、orderNum、status、icon、remark。
  - DIRECTORY / MENU（`state.type !== 'BUTTON'`）：path、component（MENU）、isFrame、isCache、visible、queryParams。
  - BUTTON（`state.type === 'BUTTON'`）：permissionCode。
- 特有动作：新增子菜单预置 `parentId`，按父类型限制子类型（DIRECTORY 下可建 DIRECTORY/MENU，MENU 下可建 BUTTON）。
- 边界：BUTTON 不渲染路由字段；有子节点的目录删除需确认；`permissionCode` 唯一。
- 常量：`MENU_TYPE_LABEL` / `MENU_TYPE_COLOR` / `MENU_TYPE_ICON`（`app/constants/system.ts`）。

### 部门管理 dept

数据形态：树 `DeptResp[]`（`GET /v1/system/depts/tree`）。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/depts/tree` | GET | 部门树 |
| `/v1/system/depts` | GET / POST | 列表 / 新增 |
| `/v1/system/depts/{id}` | GET / PUT / DELETE | 详情 / 修改 / 删除 |
| `/v1/system/depts/{id}/children-ids` | GET | 部门及子部门 ID（删除级联判断） |

类型：`DeptResp`（含 `leaderUserName`、`children?`）、`DeptCreateReq`、`DeptUpdateReq = DeptCreateReq`。`DeptStatus = ENABLED | DISABLED`。

- 列（树表）：deptName（树展开列） · deptCode · orderNum · leaderUserName · phone · status（badge） · createdAt · actions（右：新增子部门 / 编辑 / 删除）。
- 表单：parentId（部门树扁平 selectMenu，新增子部门预置）、deptName、deptCode、orderNum（number）、leaderUserId（用户 selectMenu，函数式 `controlProps`）、phone、email、status。
- 特有动作：新增子部门预置 `parentId = row.id`；删除前 `getChildIds(id)`，有子部门时阻止或级联确认。
- 边界：根部门、有子节点部门删除受限。

### 岗位管理 post

数据形态：全量 list `PostResp[]`（`GET /v1/system/posts`，无分页 / 无 query → 客户端过滤）。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/posts` | GET / POST | 全量列表 / 新增 |
| `/v1/system/posts/{id}` | GET / PUT / DELETE | 详情 / 修改 / 删除 |

类型：`PostResp`、`PostCreateReq`（含 postCode）、`PostUpdateReq`（无 postCode）。`PostStatus = ENABLED | DISABLED`。

- 列：postCode · postName · orderNum · status（badge） · createdAt · actions（右：编辑 / 删除）。客户端全量表可开 `sortable`。
- 搜索（`:cols="5"`，客户端过滤）：postCode、postName（包含匹配）、status。
- 表单：postCode（编辑禁用，函数式 `controlProps`）、postName、orderNum（number）、status、remark（textarea）。
- 复用：岗位选项被用户表单 `postIds` 复用（`useUserFormOptions`）。

### 字典管理 dict

数据形态：主从双 list。字典类型为全量 list，字典数据按 `dictType` 取全量 list。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/dicts/types` | GET / POST | 字典类型列表（全量） / 新增 |
| `/v1/system/dicts/types/{id}` | GET / PUT / DELETE | 类型详情 / 修改 / 删除 |
| `/v1/system/dicts/data` | GET / POST | 字典数据（query：`dictType` 必填） / 新增 |
| `/v1/system/dicts/data/{id}` | GET / PUT / DELETE | 数据详情 / 修改 / 删除 |
| `/v1/system/dicts/refresh-cache` | POST | 刷新字典缓存 |

类型：
- `DictTypeResp` / `DictTypeCreateReq` / `DictTypeUpdateReq`：dictName、dictType、status（ENABLED/DISABLED）、remark。Req 必填 dictName、dictType。
- `DictDataResp` / `DictDataCreateReq` / `DictDataUpdateReq`：dictType、dictLabel、dictValue、dictSort（int）、cssClass、listClass、isDefault（boolean）、status、remark。Req 必填 dictLabel、dictType、dictValue。

- 页面（主从）：左字典类型表（搜索 dictName / dictType，客户端过滤），右侧按 `selectedType` 拉对应字典数据表；`selectedType` 变化触发右表刷新。
- 列：
  - 类型：dictName · dictType · status（badge） · remark（tooltip） · actions（编辑 / 删除 / 管理数据）。
  - 数据：dictLabel（badge，颜色取 `listClass`） · dictValue · dictSort · isDefault · status（badge） · actions（编辑 / 删除）。
- 表单：
  - 类型：dictName、dictType（编辑禁用）、status、remark。
  - 数据：dictType（预置当前 `selectedType`，禁用）、dictLabel、dictValue、dictSort（number）、listClass（颜色 enum）、isDefault（boolean）、status、remark。
- 特有动作：工具条「刷新缓存」→ `refresh-cache`；右表新增预置 `dictType`。
- 边界：内置字典类型禁删；同类型下 `dictValue` 唯一。

### 系统配置 config

数据形态：全量 list `ConfigResp[]`（`GET /v1/system/configs`，无分页 / 无 query → 客户端过滤）。

> 注意：与旧规划不同，后端返回全量 list 而非分页，配置项搜索走客户端过滤（同 post）。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/configs` | GET / POST | 全量列表 / 新增 |
| `/v1/system/configs/{id}` | GET / PUT / DELETE | 详情 / 修改 / 删除 |
| `/v1/system/configs/refresh-cache` | POST | 刷新配置缓存 |
| `/v1/system/configs/key/{configKey}` | GET | 按配置键取值 |

类型：`ConfigResp` / `ConfigCreateReq` / `ConfigUpdateReq`：configName、configKey、configValue、configType（`BUILTIN | CUSTOM`）、remark。Req 必填 configKey、configName。

- 列：configName · configKey · configValue（tooltip） · configType（badge：内置 / 自定义） · remark（tooltip） · createdAt · actions（右：编辑 / 删除）。
- 搜索（`:cols="4"`，客户端过滤）：configName、configKey、configType。
- 表单：configName、configKey（编辑禁用，函数式 `controlProps`）、configValue、configType、remark（textarea）。
- 特有动作：工具条「刷新缓存」→ `refresh-cache`。
- 边界：`BUILTIN` 配置禁删、禁改 key。

### 通知公告 notice

数据形态：分页 `PageResp<NoticeResp>`，但**列表仅接受 `page / size / sort`，无业务 query** → 标题 / 类型 / 状态走客户端过滤。

> 注意：状态枚举为 `ENABLED | DISABLED`（启用 / 停用），后端无草稿 / 发布态；前台展示用独立 `/published` 端点取启用公告。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/notices` | GET / POST | 分页列表（仅 page/size/sort） / 新增 |
| `/v1/system/notices/{id}` | GET / PUT / DELETE | 详情 / 修改 / 删除 |
| `/v1/system/notices/published` | GET | 已启用公告（前台 / 首页用） |

类型：`NoticeResp`（id、noticeTitle、noticeType、noticeContent、status、creator、createdAt、updatedAt）、`NoticeCreateReq` / `NoticeUpdateReq`：noticeTitle（必填，≤100）、noticeType（必填，`NOTICE | ANNOUNCEMENT`）、noticeContent（≤10000）、status。

- 列：selection（左） · noticeTitle（tooltip） · noticeType（badge） · status（badge） · createdAt · actions（右：编辑 / 删除）。
- 搜索（`:cols="4"`，客户端过滤）：noticeTitle、noticeType、status。
- 表单：noticeTitle、noticeType（enum）、status（enum）、noticeContent（textarea，富文本可后续接入）。
- 边界：内容 ≤10000 字符；标题 ≤100。

### 文件管理 file

数据形态：分页 `PageResp<FileResp>`。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/system/files` | GET | 分页列表（query：originalName / category / contentType / page / size） |
| `/v1/system/files/upload` | POST | 上传（multipart） |
| `/v1/system/files/upload/batch` | POST | 批量上传（multipart） |
| `/v1/system/files/{id}` | GET / DELETE | 详情 / 删除 |
| `/v1/system/files/batch` | DELETE | 批量删除（body：id 数组） |
| `/v1/system/files/preview/{id}` | GET | 预览 |
| `/v1/system/files/download/{id}` | GET | 下载 |

类型：`FileResp`：id、originalName、storageName、extension、contentType、size（int64 字节）、sizeFormatted、path、md5、storageType、category、downloadUrl、createdAt、remark。`FileListQuery`：originalName、category、contentType、page、size。

- 列：selection（左） · originalName（tooltip） · contentType（badge） · category · sizeFormatted · createdAt · actions（右：预览 / 下载 / 删除）。
- 搜索（`:cols="4"`，服务端 query）：originalName、category、contentType。
- 上传：工具条「上传」按钮 → `UModal` + `UInput`（分类，自由文本）+ `UFileUpload`，走批量端点 `upload/batch`（`useUploadWithProgress`），`category` 作为 query 参数；上传中可取消（`abort`），批量部分失败给「成功 X，失败 Y」提示，成功后 `refresh`。
- 特有动作：预览（图片 / 文本 inline，走 `preview/{id}`）；下载走 `download/{id}` 或 `downloadUrl`；批量删除走 `files/batch`。
- 边界：类型 / 大小在控件层校验；预览大文件回退下载。

## 系统监控 monitor

monitor 是新域，三个模块共用一套搭建：

- 新建 `app/api/monitor/<x>.ts`、`app/composables/monitor/use<X>List.ts`、`app/pages/monitor/<x>.vue`。
- 父布局 `app/pages/monitor.vue`：`<AppPanel id="monitor" title="系统监控">` + `<UNavigationMenu>` + `<NuxtPage />`（参照 `app/pages/system.vue`）。
- `app/composables/useNavigation.ts` 新增「系统监控」分组（`to: '/monitor'`），子项：操作日志、登录日志、在线用户，并导出 `monitorLinks`。

日志类型字段对照：`OperateLogResp` / `LoginLogResp` 的 `status` 为字符串枚举 `SUCCESS | FAILURE`，但**列表 query 的 `status` 是 integer**（需映射，约定 1=成功 / 0=失败，以后端为准）；`id` 为 int64。

### 操作日志 operate-log

数据形态：分页 `PageResp<OperateLogResp>`（只读）。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/monitor/operate-logs` | GET | 分页（query：userId / module / operation / status:int / startTime / endTime / page / size） |
| `/v1/monitor/operate-logs` | DELETE | 按保留天数清理（query：`days`，默认 30，最少 7） |
| `/v1/monitor/operate-logs/{id}` | GET | 详情 |
| `/v1/monitor/operate-logs/export` | GET | 导出（blob 下载） |

类型：`OperateLogResp`：id、traceId、userId、username、module、operation、method、requestMethod、requestUrl、requestParams、requestBody、responseData、userIp、userAgent、operationTime（int32 ms）、status（SUCCESS/FAILURE）、errorMsg、createdAt。`OperateLogListQuery`：userId、module、operation、status（number）、startTime、endTime、page、size。

- 列：module · operation · username · userIp · requestMethod · operationTime（ms） · status（badge） · createdAt · actions（右：详情）。无新增 / 编辑。
- 搜索（`:cols="5"`，服务端 query）：module、operation、username（按 userId 需选择器，或先用 username 客户端辅助）、status（enum→映射 int）、操作时间范围（startTime / endTime）。
- 特有动作：详情（`USlideover` 只读，含 requestParams / requestBody / responseData / errorMsg）；工具条「清理」（按天数，confirm）+「导出」（blob）。
- 边界：纯只读；清理最少保留 7 天；导出走文件流。

### 登录日志 login-log

数据形态：分页 `PageResp<LoginLogResp>`（只读）。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/monitor/login-logs` | GET | 分页（query：username / loginIp / status:int / startTime / endTime / page / size） |
| `/v1/monitor/login-logs` | DELETE | 按保留天数清理（query：`days`，默认 90，最少 7） |
| `/v1/monitor/login-logs/{id}` | GET | 详情 |
| `/v1/monitor/login-logs/export` | GET | 导出（blob 下载） |

类型：`LoginLogResp`：id、traceId、userId、username、loginType（`PASSWORD | SMS | OAUTH | LOGOUT`）、loginIp、loginLocation、browser、os、status（SUCCESS/FAILURE）、message、createdAt。`LoginLogListQuery`：username、loginIp、status（number）、startTime、endTime、page、size。

- 列：username · loginType（badge） · loginIp · loginLocation · browser · os · status（badge） · message（tooltip） · createdAt · actions（右：详情，可选）。
- 搜索（`:cols="5"`）：username、loginIp、status（enum→映射 int）、登录时间范围。
- 特有动作：工具条「清理」（按天数，confirm）+「导出」。
- 边界：纯只读；清理最少保留 7 天。

### 在线用户 online-user

数据形态：分页 `PageResp<OnlineUserResp>`。

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/v1/monitor/online-users` | GET | 分页（query：username / loginIp / page / size） |
| `/v1/monitor/online-users/count` | GET | 在线数（顶部概览卡片可用） |
| `/v1/monitor/online-users/users/{userId}/sessions` | GET | 查某用户全部会话 |
| `/v1/monitor/online-users/sessions/{tokenId}` | DELETE | 强制下线单会话（按 RefreshToken ID） |
| `/v1/monitor/online-users/users/{userId}` | DELETE | 强制下线某用户全部会话 |
| `/v1/monitor/online-users/sessions` | DELETE | 批量强制下线（body：tokenId 数组） |

类型：`OnlineUserResp`：id（会话 / RefreshToken ID）、userId、username、deviceInfo、clientIp、issuedAt、expiresAt、lastUsedAt。`OnlineUserListQuery`：username、loginIp、page、size。

- 列：selection（左） · username · clientIp · deviceInfo（tooltip） · issuedAt · lastUsedAt · expiresAt · actions（右：强制下线 confirm）。
- 搜索（`:cols="3"`）：username、loginIp。
- 特有动作：
  - 行内「强制下线」（confirm）→ 按行 `id` 调 `sessions/{tokenId}`；可选「踢出该用户全部会话」→ `users/{userId}`。
  - 工具条批量强制下线（选中行的 `id` 数组）→ `sessions`。
  - 可选顶部概览：`count` 在线数卡片。
- 边界：不可强制下线自己当前会话（或二次确认）。
