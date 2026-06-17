# 用户管理 user（参考实现）

已实现样板：[app/pages/system/user.vue](../../app/pages/system/user.vue)。其余列表页参照本页与 [AGENTS.md](../../AGENTS.md) 配方。

## 数据形态

分页 `PageResp<UserResp>`。API [app/api/system/user.ts](../../app/api/system/user.ts)、composable [useUserList](../../app/composables/system/useUserList.ts)。

## API 端点

`GET/POST /v1/system/users`、`PUT/DELETE /v1/system/users/{id}`、批删、`POST .../reset-password`、`POST .../{userId}/roles`、`.../{userId}/posts`。

## 页面布局（两栏）

左：部门树筛选（`UTree`，常驻展开 + `@toggle.prevent`，点击只过滤）；右：搜索 + 工具条 + 表格 + 弹窗。

## 列设计

`selection`(左固定) · `username` · `nickname` · `phone` · `email`(size+tooltip) · `deptName` · `status`(badge) · `createdAt` · `actions`(右固定：编辑/重置密码/删除)。

## 搜索（`:cols="5"`）

`username`、`nickname`、`phone`、`status`(enum，含 DELETED)。部门由左树承担（不放搜索）。

## 表单（USlideover + MAutoForm）

- `username`(编辑禁用，函数式 controlProps)、`password`(`meta.if: () => !isEditing.value`，新增才显示且校验)、`nickname`、`email`、`phone`、`gender`(enum)、`status`(enum)、`deptId`/`roleIds`/`postIds`(动态选项，函数式 controlProps)、`remark`。
- 选项源 [useUserFormOptions](../../app/composables/system/useUserFormOptions.ts)：`deptOptions`/`deptTreeItems`/`roleOptions`/`postOptions`。
- 类型：`type FormSchema = z.output<typeof formSchema>`，`onFormSubmit(e: FormSubmitEvent<FormSchema>)`，编辑剥离 `username`/`password`。

## 特有动作

重置密码：独立 `UModal` + `MAutoForm`(`newPassword`) → `handleResetPassword`。

## 备注

> 依赖 `@movk/nuxt` 的 `meta.if` 修复（隐藏即不校验）。详见根 plan 与 AGENTS.md「AutoForm 要点」。
