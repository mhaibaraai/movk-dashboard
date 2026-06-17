# 部门管理 dept

> Phase 2：现 `app/pages/system/dept.vue` 为 v3 `UTable` 写法，迁移到 `MDataTable`（树表）+ `MAutoForm`。

## 数据形态

树 `Tree<DeptResp>`（`GET /v1/system/depts/tree`）。API 与类型已就绪：[app/api/system/dept.ts](../../app/api/system/dept.ts)、composable [useDeptTree](../../app/composables/system/useDeptTree.ts)。

## API 端点

- `GET/POST /v1/system/depts`、`PUT/DELETE /v1/system/depts/{id}`、`GET /v1/system/depts/tree`、`GET /v1/system/depts/{id}/children-ids`（删除级联判断）。

## 类型（已定义）

`DeptCreateReq`（deptName 必填；parentId/deptCode/orderNum/leaderUserId/phone/email/status）、`DeptUpdateReq = DeptCreateReq`。

## 列设计（树表）

`MDataTable` 树模式（或保留 `UTree` 左树 + 右表）：`deptName`(树展开列) · `deptCode` · `orderNum` · `leaderUserId`(显示负责人名，需用户名映射) · `phone` · `status`(badge) · `createdAt` · `actions`(右固定：新增子部门 / 编辑 / 删除)。

## 搜索字段

部门通常树展示无需分页搜索；可加 `deptName` 客户端过滤（树过滤）或不加。

## 表单字段（USlideover + MAutoForm）

- `parentId`(selectMenu，选项为部门树扁平 `Tree.toList`；新增子部门时预置)、`deptName`、`deptCode`、`orderNum`(number)、`leaderUserId`(selectMenu 用户)、`phone`、`email`(afz.email)、`status`(enum)。
- 动态选项用函数式 `controlProps`（部门/用户选项异步）。

## 特有动作

- 「新增子部门」：行内动作，预置 `parentId = row.id`。
- 删除：先 `getChildIds(id)`，有子部门时提示不可删除或级联确认。

## 边界 / 权限

根部门 / 有子节点的部门删除限制；负责人需从用户列表选择。
