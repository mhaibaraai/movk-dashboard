# 菜单管理 menu

> Phase 2：现 `app/pages/system/menu.vue` 为 v3 `UTable` 写法，迁移到 `MDataTable`（树表）+ `MAutoForm`。`meta.if` 按菜单类型条件渲染字段的典型场景。

## 数据形态

树 `Tree<MenuResp>`（`GET /v1/system/menus/tree`）。API 与类型已就绪：[app/api/system/menu.ts](../../app/api/system/menu.ts)、composable [useMenuTree](../../app/composables/system/useMenuTree.ts)。

## API 端点

- `GET/POST /v1/system/menus`、`PUT/DELETE /v1/system/menus/{id}`、`GET /v1/system/menus/tree`、`GET /v1/system/menus/permissions/all`、`user/*`（当前用户菜单/权限）。

## 类型（已定义）

`MenuCreateReq`（type 必填：DIRECTORY/MENU/BUTTON；parentId/name/orderNum/path/component/queryParams/isFrame/isCache/permissionCode/visible/status/icon/remark）、`MenuUpdateReq = MenuCreateReq`。

## 列设计（树表）

`name`(树展开列，配 `icon`) · `type`(badge：目录/菜单/按钮) · `permissionCode` · `path` · `orderNum` · `visible`(badge) · `status`(badge) · `actions`(右固定：新增子菜单 / 编辑 / 删除)。

## 表单字段（按 type 条件渲染 —— `meta.if`）

- 公共：`parentId`(树选择)、`type`(enum，先选)、`name`、`orderNum`、`status`、`icon`(图标选择)、`remark`。
- `DIRECTORY`/`MENU`：`path`、`component`(MENU)、`isFrame`、`isCache`、`visible` —— `meta.if: ({ state }) => state.type !== 'BUTTON'`。
- `BUTTON`：`permissionCode` —— `meta.if: ({ state }) => state.type === 'BUTTON'`。
- 依赖库已修复的 `meta.if`（隐藏即不校验），条件必填（如 MENU 的 path）随类型切换正确生效。

## 特有动作

- 「新增子菜单」：预置 `parentId`、按父类型限制可选子类型（DIRECTORY 下可建 MENU/DIRECTORY，MENU 下可建 BUTTON）。

## 边界 / 权限

按钮类型不渲染路由相关字段；删除有子节点的目录需确认/限制；权限码唯一。
