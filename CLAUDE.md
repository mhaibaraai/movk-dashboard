# CLAUDE.md

本项目（Movk Dashboard，Nuxt 4 + `@movk/nuxt` + `@nuxt/ui` v4 的 RBAC 管理后台）的工程约定、分层、组件与表单/表格配方统一见下方指南，开发前务必阅读：

@AGENTS.md

## 常用命令

```bash
pnpm dev         # 本地开发
pnpm lint        # ESLint
pnpm typecheck   # nuxi typecheck
```

## 速记

- 参考实现：`app/pages/system/user.vue`。
- 模块统一设计：`MODULES.md`（root）。
- 属于 `@movk/nuxt` 的问题在库源头（`/Users/yixuanmiao/Projects/movk-nuxt`）修复并经 pkg.pr.new 发布后再升级消费。
