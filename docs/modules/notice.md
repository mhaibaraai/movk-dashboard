# 通知公告 notice

> Phase 3 新增。实现前用 MCP 拉 `/v1/system/notices` schema。

## 数据形态

分页 `PageResp<NoticeResp>`。

## API 端点

- `GET/POST /v1/system/notices`、`PUT/DELETE /v1/system/notices/{id}`、批删。
- `GET /v1/system/notices/published`（已发布列表，前台/首页用）。

## 类型（待 MCP 确认）

`NoticeCreateReq`/`UpdateReq`：`title`、`type`（NOTICE/ANNOUNCEMENT）、`content`(富文本/textarea)、`status`（DRAFT/PUBLISHED）、`publishTime?`。`NoticeListQuery`：`title`、`type`、`status`、`createdAt*`。

## composable

`useNoticeList`（标准分页模板）。

## 列设计

`selection`(左) · `title`(tooltip) · `type`(badge) · `status`(badge：草稿/已发布) · `publishTime` · `createdAt` · `actions`(右：编辑/发布/删除)。

## 搜索（`:cols="5"`）

`title`、`type`(enum)、`status`(enum)。

## 表单

`title`、`type`(enum)、`status`(enum)、`content`(textarea，富文本可后续接入)、`publishTime`(可选，状态为 PUBLISHED 时 `meta.if` 显示)。

## 特有动作

行内「发布」：将 `status` 置 PUBLISHED（走 update）。

## 边界 / 权限

草稿不出现在 `/published`；发布时间默认当前时间。
