# Movk Dashboard

简体中文 | [English](./README.en.md)

> 基于 Nuxt 4 + [`@movk/nuxt`](https://github.com/mhaibaraai/movk-nuxt) + `@nuxt/ui` v4 的 RBAC 管理后台。消费外部 Movk RBAC 后端，采用 SSR 渲染与 JWT 会话鉴权。

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82.svg)](https://nuxt.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8.svg)](https://tailwindcss.com/)
[![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-v4-00DC82.svg)](https://ui.nuxt.com/)

## ✨ 特性

- **RBAC 管理后台** - 用户、角色、菜单、部门、岗位、字典、配置、通知、文件等系统管理能力，配套在线/登录/操作日志监控。
- **Schema 驱动表单** - 基于 `@movk/nuxt` 的 `MAutoForm` / `MSearchForm` 与 Zod v4，定义即渲染，统一校验与 UI 配置。
- **统一数据表格** - `AppDataTable`(封装 `MDataTable`)提供工具栏、列显隐、列宽拖拽、服务端分页与批量操作。
- **SSR + JWT 会话** - 通过 Nuxt 服务端路由(`server/api/jwt/*`)管理会话,`@movk/nuxt` 的 `useApiFetch` 自动解包响应信封与注入鉴权。
- **类型安全** - 实体响应类型集中于 `shared/types`,从 Schema 到表单数据全链路 TypeScript 推断。

## 🧩 功能范围

| 域 | 页面 |
|------|------|
| 鉴权 | `login`、`register` |
| System | `user`、`role`、`menu`、`dept`、`post`、`notice`、`dict`、`config`、`file` |
| Monitor | `online`、`login-log`、`operate-log` |

## ⚡ 技术栈

- [Nuxt 4](https://nuxt.com/) + Vue 3 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)、[Zod v4](https://zod.dev/)
- [`@nuxt/ui` v4](https://ui.nuxt.com/)(基础组件 `U*`)
- [`@movk/nuxt`](https://github.com/mhaibaraai/movk-nuxt)(`MDataTable` / `MSearchForm` / `MAutoForm` / `useApiFetch` 等复合能力)
- `@movk/core`(`Tree` 等工具)、[VueUse](https://vueuse.org/)、[Iconify](https://iconify.design/)(Lucide / Simple Icons)

## 📁 目录结构

```text
app/
  api/system/<resource>.ts        # use<Resource>Api() + 请求/响应类型
  composables/system/use<X>List.ts # 域分组列表逻辑
  pages/system/<resource>.vue     # 列表页(user.vue 为参考实现)
  components/AppDataTable.vue      # 统一表格工具栏 + 列显隐
  constants/system.ts             # 状态/性别等 颜色 + 标签映射
server/api/jwt/                    # JWT 会话创建/刷新
shared/types/system.ts            # 实体响应类型(全局可用)
public/                            # 静态资源
```

详细工程约定、分层与可复制配方见 [`AGENTS.md`](./AGENTS.md)。

## 🚀 快速开始

环境要求:Node `^20.19.0 || >=22.12.0`、pnpm `11.8.0`。

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 NUXT_API_BASE 与 NUXT_SESSION_PASSWORD

# 启动本地开发
pnpm dev
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `NUXT_API_BASE` | 后端 RBAC API 地址,在**构建时**经 `process.env` 读取,默认 `/api` |
| `NUXT_SESSION_PASSWORD` | 会话加密密钥,运行时必需,使用 `openssl rand -base64 32` 生成 |

### 常用命令

```bash
pnpm dev         # 本地开发
pnpm build       # 生产构建(产物在 .output/)
pnpm preview     # 本地预览生产构建
pnpm lint        # ESLint
pnpm typecheck   # nuxi typecheck
```

提交前 `pnpm lint` 与 `pnpm typecheck` 必须通过。

## 🐳 部署

应用为 SSR,需 Node 运行时,不能纯静态托管。构建在 CI 完成,镜像仅打包 `.output` 运行产物。

```bash
# 1. 构建(注入构建时变量)
NUXT_API_BASE=https://your-backend pnpm build

# 2. 构建镜像
docker build -t movk-dashboard .

# 3. 运行(注入运行时变量)
docker run --rm -p 3000:3000 \
  -e NUXT_SESSION_PASSWORD=your-session-password \
  movk-dashboard
```

推送 `main` 时,[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) 自动构建并将镜像推送至 GHCR(`latest` + commit SHA 双标签),由外部编排拉取运行。需在仓库 Settings → Secrets 配置 `NUXT_API_BASE` 与 `NUXT_SESSION_PASSWORD`。

## 📚 文档

- [`AGENTS.md`](./AGENTS.md) - 工程约定与可复制配方
- [`CLAUDE.md`](./CLAUDE.md) - 项目速记

## 📄 License

[MIT](./LICENSE)
