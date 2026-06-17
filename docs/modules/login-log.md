# 登录日志 login-log

> Phase 4（monitor 域，搭建见 [operate-log.md](./operate-log.md)）。只读分页 + 清空 + 导出。实现前用 MCP 拉 `/v1/monitor/login-logs` schema。

## 数据形态

分页 `PageResp<LoginLogResp>`（只读）。

## API 端点

- `GET /v1/monitor/login-logs`、`GET /v1/monitor/login-logs/{id}`。
- `DELETE /v1/monitor/login-logs`（清空/批删）、`GET /v1/monitor/login-logs/export`。

## 类型（待 MCP 确认）

`LoginLogResp`：`id`、`userName`、`ipaddr`、`loginLocation`、`browser`、`os`、`status`(成功/失败)、`msg`、`loginTime`。`LoginLogListQuery`：`userName`、`ipaddr`、`status`、`loginTime*`。

## 列设计

`userName` · `ipaddr` · `loginLocation` · `browser` · `os` · `status`(badge) · `msg`(tooltip) · `loginTime` · `actions`(右：详情，可选)。

## 搜索（`:cols="5"`）

`userName`、`ipaddr`、`status`(enum)、登录时间范围。

## 特有动作

工具条「清空」(confirm) + 「导出」。

## 边界 / 权限

纯只读。
