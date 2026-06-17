# 岗位管理 post（参考实现）

已实现样板：[app/pages/system/post.vue](../../app/pages/system/post.vue)。展示「后端无 query → 客户端过滤」与静态 schema + 函数式 controlProps 的写法。

## 数据形态

全量 `List<PostResp>`（`GET /v1/system/posts` 无分页、无 query 参数）。API [app/api/system/post.ts](../../app/api/system/post.ts)、composable [usePostList](../../app/composables/system/usePostList.ts)。

## API 端点

`GET/POST /v1/system/posts`、`GET/PUT/DELETE /v1/system/posts/{id}`。

## 列设计

`postCode` · `postName` · `orderNum` · `status`(badge) · `createdAt` · `actions`(右固定：编辑/删除)。

## 搜索（`:cols="5"`，客户端过滤）

`postCode`、`postName`(包含匹配)、`status`(enum)。`@submit` 写入 `appliedSearch`，`filteredPosts = computed` 过滤后喂 `MDataTable`。

## 表单（USlideover + MAutoForm）

`postCode`(编辑禁用，函数式 controlProps)、`postName`、`orderNum`(number)、`status`(enum)、`remark`(textarea)。`type PostSchema = z.output<typeof schema>`，`onSubmit(e: FormSubmitEvent<PostSchema>)`，编辑剥离 `postCode`。

## 备注

岗位选项同时被用户表单（`postIds`）通过 `useUserFormOptions` 复用。
