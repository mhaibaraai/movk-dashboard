# Movk Dashboard

English | [简体中文](./README.md)

> An RBAC admin dashboard built on Nuxt 4 + [`@movk/nuxt`](https://github.com/mhaibaraai/movk-nuxt) + `@nuxt/ui` v4. It consumes an external Movk RBAC backend with SSR rendering and JWT session auth.

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82.svg)](https://nuxt.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8.svg)](https://tailwindcss.com/)
[![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-v4-00DC82.svg)](https://ui.nuxt.com/)

## ✨ Features

- **RBAC admin dashboard** - System management for users, roles, menus, departments, posts, dictionaries, configs, notices, and files, plus online / login / operation log monitoring.
- **Schema-driven forms** - `MAutoForm` / `MSearchForm` from `@movk/nuxt` with Zod v4: define-is-render, unifying validation and UI configuration.
- **Unified data table** - `AppDataTable` (wrapping `MDataTable`) provides a toolbar, column visibility, column resizing, server-side pagination, and batch operations.
- **SSR + JWT session** - Sessions are managed through Nuxt server routes (`server/api/jwt/*`); `useApiFetch` from `@movk/nuxt` auto-unwraps the response envelope and injects auth.
- **Type safety** - Entity response types live in `shared/types`, with full TypeScript inference from Schema to form data.

## 🧩 Scope

| Domain | Pages |
|------|------|
| Auth | `login`, `register` |
| System | `user`, `role`, `menu`, `dept`, `post`, `notice`, `dict`, `config`, `file` |
| Monitor | `online`, `login-log`, `operate-log` |

## ⚡ Tech Stack

- [Nuxt 4](https://nuxt.com/) + Vue 3 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/), [Zod v4](https://zod.dev/)
- [`@nuxt/ui` v4](https://ui.nuxt.com/) (base `U*` components)
- [`@movk/nuxt`](https://github.com/mhaibaraai/movk-nuxt) (`MDataTable` / `MSearchForm` / `MAutoForm` / `useApiFetch`, etc.)
- `@movk/core` (`Tree` and other utilities), [VueUse](https://vueuse.org/), [Iconify](https://iconify.design/) (Lucide / Simple Icons)

## 📁 Project Structure

```text
app/
  api/system/<resource>.ts        # use<Resource>Api() + request/response types
  composables/system/use<X>List.ts # domain-grouped list logic
  pages/system/<resource>.vue     # list pages (user.vue is the reference)
  components/AppDataTable.vue      # unified table toolbar + column visibility
  constants/system.ts             # status/gender color + label maps
server/api/jwt/                    # JWT session create/refresh
shared/types/system.ts            # entity response types (globally available)
public/                            # static assets
```

For detailed engineering conventions, layering, and reusable recipes, see [`AGENTS.md`](./AGENTS.md).

## 🚀 Getting Started

Requirements: Node `^20.19.0 || >=22.12.0`, pnpm `11.8.0`.

```bash
# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env to set NUXT_API_BASE and NUXT_SESSION_PASSWORD

# Start local development
pnpm dev
```

### Environment Variables

| Variable | Description |
|------|------|
| `NUXT_API_BASE` | Backend RBAC API URL, read from `process.env` at **build time**, defaults to `/api` |
| `NUXT_SESSION_PASSWORD` | Session encryption key, required at runtime, generated via `openssl rand -base64 32` |

### Commands

```bash
pnpm dev         # local development
pnpm build       # production build (output in .output/)
pnpm preview     # preview the production build locally
pnpm lint        # ESLint
pnpm typecheck   # nuxi typecheck
```

`pnpm lint` and `pnpm typecheck` must pass before committing.

## 🐳 Deployment

The app is SSR and requires a Node runtime; it cannot be hosted as pure static. The build runs in CI, and the image only packages the `.output` runtime payload.

```bash
# 1. Build (inject build-time variables)
NUXT_API_BASE=https://your-backend pnpm build

# 2. Build the image
docker build -t movk-dashboard .

# 3. Run (inject runtime variables)
docker run --rm -p 3000:3000 \
  -e NUXT_SESSION_PASSWORD=your-session-password \
  movk-dashboard
```

On push to `main`, [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) builds and pushes the image to GHCR (`latest` + commit SHA tags) for an external orchestrator to pull and run. Configure `NUXT_API_BASE` and `NUXT_SESSION_PASSWORD` under repository Settings → Secrets.

## 📚 Documentation

- [`AGENTS.md`](./AGENTS.md) - engineering conventions and reusable recipes
- [`CLAUDE.md`](./CLAUDE.md) - project quick notes

## 📄 License

[MIT](./LICENSE)
