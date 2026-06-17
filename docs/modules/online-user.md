# 在线用户 online-user

> Phase 4（monitor 域，搭建见 [operate-log.md](./operate-log.md)）。分页 + 强制下线。实现前用 MCP 拉 `/v1/monitor/online-users` schema。

## 数据形态

分页 `PageResp<OnlineUserResp>`。

## API 端点

- `GET /v1/monitor/online-users`（分页）、`GET /v1/monitor/online-users/count`（在线数，可用于概览卡片）。
- 强制下线：按会话 `DELETE /v1/monitor/online-users/{sessionId}`、按用户、批量（以 OAS 实际为准）。

## 类型（待 MCP 确认）

`OnlineUserResp`：`sessionId`/`tokenId`、`userName`、`deptName`、`ipaddr`、`loginLocation`、`browser`、`os`、`loginTime`。`OnlineUserListQuery`：`userName`、`ipaddr`。

## composable

`useOnlineUserList`（分页模板）+ `handleForceLogout(sessionId)`、`handleForceLogoutBatch(ids)`。

## 列设计

`selection`(左) · `userName` · `deptName` · `ipaddr` · `loginLocation` · `browser` · `os` · `loginTime` · `actions`(右：强制下线 `confirm`)。

## 搜索（`:cols="5"`）

`userName`、`ipaddr`。

## 特有动作

- 行内「强制下线」（confirm）→ `handleForceLogout`。
- 工具条批量强制下线（选中行）。
- 可选顶部概览：在线数 `count`。

## 边界 / 权限

不能强制下线自己当前会话（或二次确认）。
