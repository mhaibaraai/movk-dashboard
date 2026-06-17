# 操作日志 operate-log

> Phase 4（monitor 域）。只读分页 + 清空 + 导出。实现前用 MCP 拉 `/v1/monitor/operate-logs` schema。

## monitor 域搭建（Phase 4 共用）

- 新建 `app/api/monitor/<x>.ts`、`app/composables/monitor/use<X>List.ts`、`app/pages/monitor/<x>.vue`。
- `/monitor` 路由组 + 父布局 `app/pages/monitor.vue`（`<AppPanel>` + `<NuxtPage>`，与 `system.vue` 一致）。
- `useNavigation` 增加「系统监控」分组：操作日志 `/monitor/operate-log`、登录日志 `/monitor/login-log`、在线用户 `/monitor/online-user`。

## 数据形态

分页 `PageResp<OperateLogResp>`（只读）。

## API 端点

- `GET /v1/monitor/operate-logs`（分页）、`GET /v1/monitor/operate-logs/{id}`（详情）。
- `DELETE /v1/monitor/operate-logs`（清空/批删）、`GET /v1/monitor/operate-logs/export`（导出，blob 下载）。

## 类型（待 MCP 确认）

`OperateLogResp`：`id`、`title`(模块)、`businessType`(操作类型)、`method`、`requestMethod`、`operatorType`、`operName`、`operIp`、`operLocation`、`status`(成功/失败)、`costTime`、`operTime`、`errorMsg`。`OperateLogListQuery`：`title`、`operName`、`businessType`、`status`、`operTime*`。

## 列设计

`title` · `businessType`(badge) · `operName` · `operIp` · `operLocation` · `requestMethod` · `status`(badge) · `costTime`(ms) · `operTime` · `actions`(右：详情)。无新增/编辑。

## 搜索（`:cols="5"`）

`title`、`operName`、`businessType`(enum)、`status`(enum)、操作时间范围。

## 特有动作

- 详情：`USlideover` 只读展示（含 `errorMsg`、请求参数）。
- 工具条：「清空」(confirm) + 「导出」(blob → 下载)。

## 边界 / 权限

纯只读；导出走文件流；清空需二次确认。
