# 文件管理 file

> Phase 3 新增。分页 + 上传。实现前用 MCP 拉 `/files` schema。

## 数据形态

分页 `PageResp<FileResp>`。

## API 端点

- `POST /v1/system/files/upload`、`POST /v1/system/files/upload/batch`（multipart）。
- `GET /v1/system/files`（分页列表）。
- `GET /v1/system/files/{id}`（预览/下载）、`DELETE /v1/system/files/{id}`、`DELETE /v1/system/files/batch`。

## 类型（待 MCP 确认）

`FileResp`：`id`、`originalName`、`fileName`、`fileSize`、`contentType`、`storagePath`/`url`、`createdAt`。`FileListQuery`：`originalName`、`contentType`、`createdAt*`。

## composable

`useFileList`（分页模板）+ `handleUpload(files)`、`handleDownload(id)`、`handleDelete/DeleteBatch`。上传用 `$api` 传 `FormData`。

## 列设计

`selection`(左) · `originalName`(tooltip) · `contentType`(badge) · `fileSize`(格式化 KB/MB) · `createdAt` · `actions`(右：预览/下载/删除)。

## 搜索（`:cols="5"`）

`originalName`、`contentType`。

## 上传

工具条「上传」按钮：`UModal` + `MAutoForm`（`afz.file({ multiple: true })`）或直接 `UFileUpload`；提交 → `handleUpload` → `refresh`。

## 特有动作

预览（图片/文本 inline，其它走下载）、批量删除。

## 边界 / 权限

限制类型/大小（控件层校验）；预览大文件走下载。
