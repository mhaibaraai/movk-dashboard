# 参数配置 config

> Phase 3 新增。实现前用 MCP `read_project_oas_ref_resources_odlgm9` 拉 `/v1/system/configs` 的 Req/Resp 落 `shared/types/system.ts`。

## 数据形态

分页 `PageResp<ConfigResp>`。

## API 端点

- `GET/POST /v1/system/configs`、`PUT/DELETE /v1/system/configs/{id}`、批删。
- `POST /v1/system/configs/refresh-cache`（刷新缓存）。
- `GET /v1/system/configs/key/{configKey}`（按 key 取值）。

## 类型（待 MCP 确认）

`ConfigCreateReq`/`UpdateReq`：`configName`、`configKey`(编辑禁用)、`configValue`、`configType`（SYSTEM/CUSTOM）、`remark`。`ConfigListQuery`：`configName`、`configKey`、`configType`。

## composable

`useConfigList`（标准分页模板）+ `handleRefreshCache()`。

## 列设计

`selection`(左) · `configName` · `configKey` · `configValue`(tooltip) · `configType`(badge) · `remark`(tooltip) · `createdAt` · `actions`(右：编辑/删除)。

## 搜索（`:cols="5"`）

`configName`、`configKey`、`configType`(enum)。

## 表单

`configName`、`configKey`(编辑禁用，函数式 controlProps)、`configValue`、`configType`(enum)、`remark`(textarea)。

## 特有动作

工具条「刷新缓存」按钮 → `handleRefreshCache()` + 成功 toast。

## 边界 / 权限

SYSTEM 内置参数禁止删除/禁改 key。
