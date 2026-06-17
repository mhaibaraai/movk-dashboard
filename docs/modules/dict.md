# 字典管理 dict

> Phase 3 新增。类型→数据 主从双表。实现前用 MCP 拉 `/dicts/types`、`/dicts/data` schema。

## 数据形态

- 字典类型 `dictType`：分页/列表。
- 字典数据 `dictData`：按选中类型过滤的列表（主从）。

## API 端点

- 类型：`GET/POST /v1/system/dicts/types`、`PUT/DELETE /v1/system/dicts/types/{id}`。
- 数据：`GET/POST /v1/system/dicts/data`、`PUT/DELETE /v1/system/dicts/data/{id}`（按 `dictType` 查询）。
- `POST /v1/system/dicts/refresh-cache`、`GET /v1/system/dicts/data/key/{dictType}`。

## 类型（待 MCP 确认）

- `DictTypeCreateReq`/`UpdateReq`：`dictName`、`dictType`(编辑禁用)、`status`、`remark`。
- `DictDataCreateReq`/`UpdateReq`：`dictType`、`dictLabel`、`dictValue`、`dictSort`、`status`、`cssClass?`/`listClass?`(badge 颜色)、`isDefault?`、`remark`。

## 页面布局（主从）

左：字典类型表（`MDataTable` 或列表，含搜索 `dictName`/`dictType`）；右：选中类型后展示该类型的字典数据表。`selectedType` 变化 → 拉取/过滤右表。

## 列设计

- 类型：`dictName` · `dictType` · `status`(badge) · `remark` · `actions`(编辑/删除/管理数据)。
- 数据：`dictLabel`(badge 用 listClass) · `dictValue` · `dictSort` · `status`(badge) · `isDefault` · `actions`。

## 表单

- 类型：`dictName`、`dictType`(编辑禁用)、`status`、`remark`。
- 数据：`dictType`(预置当前)、`dictLabel`、`dictValue`、`dictSort`(number)、`listClass`(enum 颜色)、`isDefault`(boolean)、`status`、`remark`。

## 特有动作

「刷新缓存」；右表新增预置 `dictType = selectedType`。

## 边界 / 权限

内置字典类型禁删；同类型下 `dictValue` 唯一。
