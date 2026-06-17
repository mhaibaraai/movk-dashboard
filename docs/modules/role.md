# 角色管理 role

> Phase 2：现 `app/pages/system/role.vue` 为 Nuxt UI v3 `UTable` 写法（与 v4 不兼容，是当前 typecheck 报错根因），迁移到 `MDataTable` + `MSearchForm` + `MAutoForm`，并接通「分配菜单」。

## 数据形态

分页 `PageResp<RoleResp>`。API 与类型已就绪：[app/api/system/role.ts](../../app/api/system/role.ts)、composable [useRoleList](../../app/composables/system/useRoleList.ts)。

## API 端点

- `GET/POST /v1/system/roles`、`PUT/DELETE /v1/system/roles/{id}`、批删 `DELETE /v1/system/roles`（body 为 id 数组）。
- 分配菜单：`POST /v1/system/roles/{roleId}/menus`（body 为 menuIds）—— 已有 `useRoleApi().assignMenus`。

## 类型（已定义）

`RoleCreateReq`（code/name 必填，roleSort/dataScope/dataScopeDeptIds/status/roleType/menuIds/remark）、`RoleUpdateReq`（无 code）、`RoleListQuery`（code/name/status/roleType/createdAt*）。

## composable 调整

`useRoleList` 现有 `handlePageChange(page)`，**改/补 `handlePagination(page, size)`** 以对接 `useTablePagination`（与 `useUserList` 对齐）。其余 `handleCreate/Update/Delete/DeleteBatch/getDetail/handleAssignMenus/handleSearch` 复用。

## 列设计

`selection`(左固定) · `code` · `name` · `roleType`(badge：BUILT_IN 内置/CUSTOM 自定义) · `roleSort` · `status`(badge，`ENABLED_DISABLED_*`) · `createdAt` · `actions`(右固定：编辑 / 分配菜单 / 删除)。内置角色（BUILT_IN）禁用删除。

## 搜索字段（`:cols="5"`）

`code`、`name`、`status`(enum)、`roleType`(enum)。`@submit → handleSearch(e.data)`。

## 表单字段（USlideover + MAutoForm）

- `code`（编辑禁用，函数式 controlProps）、`name`、`roleSort`(number)、`dataScope`(enum：ALL/DEPT/DEPT_AND_CHILD/SELF/CUSTOM)、`status`(enum)、`remark`(textarea)。
- `dataScopeDeptIds`：当 `dataScope === 'CUSTOM'` 时显示（`meta.if: ({ state }) => state.dataScope === 'CUSTOM'`），多选部门（`deptOptions`）。
- 类型：`type RoleSchema = z.output<typeof schema>`，`onSubmit(e: FormSubmitEvent<RoleSchema>)`；编辑剥离 `code`。

## 特有动作：分配菜单

独立 `USlideover/UModal` + `UTree`（多选 `multiple` + `propagate-select`），数据源 `useMenuTree()`；`openAssign(id)` 先 `getDetail` 回填 `menuIds`，确认 → `handleAssignMenus(roleId, menuIds)`。

## 边界 / 权限

内置角色不可删除/不可改 code；删除前可二次确认（actions `confirm`）。
