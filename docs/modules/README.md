# 模块设计索引

每个业务模块一份设计文档，颗粒度对齐「单个模块功能」。实现遵循根目录 [AGENTS.md](../../AGENTS.md) 的分层、列/搜索/表单约定与 CRUD 配方。

## 文档模板

每份模块文档包含：

1. **数据形态**：分页 `PageResp<T>` / 全量 `List` / 树 `Tree`。
2. **API 端点**：路径 + 方法 + 特有动作（导出、刷新缓存、强制下线等）。
3. **类型**：`CreateReq` / `UpdateReq` / `ListQuery` / `Resp` 关键字段（完整字段实现前用 MCP `read_project_oas_ref_resources_odlgm9` 拉取落到 `shared/types/system.ts`）。
4. **composable**：`use<X>List` 返回与特有方法。
5. **列设计**：套用列约束（无默认 size、selection 左固定 / actions 右固定、tooltip）。
6. **搜索字段**：`MSearchForm`（`:cols="5"`）字段；无 query 的接口走客户端过滤。
7. **表单字段**：`MAutoForm` 字段与控件、条件渲染（`meta.if`）、动态选项（函数式 `controlProps`）。
8. **特有动作 / 弹窗**：分配、导出、主从联动等。
9. **边界 / 权限**：内置数据保护、删除限制、权限码。

## 落地顺序

| Phase | 模块 | 状态 |
| --- | --- | --- |
| 已完成 | [user](./user.md) · [post](./post.md) | 样板，已实现 |
| Phase 2 | [role](./role.md) · [dept](./dept.md) · [menu](./menu.md) | 迁移到 MDataTable |
| Phase 3 | [config](./config.md) · [notice](./notice.md) · [dict](./dict.md) · [file](./file.md) | 新增 system 模块 |
| Phase 4 | [operate-log](./operate-log.md) · [login-log](./login-log.md) · [online-user](./online-user.md) | monitor 域 |

## 通用约定速记

- 列表 composable：`useApiFetch<PageResp<T>>(url, { query, watch:[query], toast:false })`。
- 分页：页面用 `useTablePagination(query.size ?? 20, handlePagination)`。
- 删除：表格 actions 列 `confirm:true` + `confirmProps`，不手写弹窗。
- 树：`@movk/core` 的 `Tree`，键 `id`/`children`。
