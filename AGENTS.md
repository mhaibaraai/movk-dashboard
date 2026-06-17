# Movk Dashboard 开发指南

面向本仓库（基于 Nuxt 4 + `@movk/nuxt` + `@nuxt/ui` v4 的 RBAC 管理后台）的工程约定与可复制配方。新增/修改页面、API、表单、表格时遵循本文。`user.vue` 是参考实现。

## 技术栈与命令

- Nuxt 4、Vue 3、TypeScript、Tailwind v4、Zod v4。
- 复合组件库 `@movk/nuxt`（`MDataTable` / `MSearchForm` / `MAutoForm` / `MMessageBox` / `useAutoForm` / `useApiFetch`），源码在 `/Users/yixuanmiao/Projects/movk-nuxt`。
- 基础组件 `@nuxt/ui` v4（`U*`）。工具库 `@movk/core`（`Tree` 等）。
- 命令：`pnpm dev`、`pnpm lint`、`pnpm typecheck`（`nuxi typecheck`）。提交前 lint 与 typecheck 必须通过。
- 架构设计以 MovkRBACAPI mcp 获取数据为准则

## 目录与分层

```text
app/
  api/system/<resource>.ts        # use<Resource>Api() + <Resource>CreateReq/UpdateReq/ListQuery
  composables/
    system/use<Resource>List.ts   # 域分组、单文件、扁平（禁止再套 <resource>/ 子目录）
    use<Generic>.ts               # 跨域通用（useTablePagination 等）置根
  constants/system.ts             # 状态/性别等 颜色 + 标签 映射
  pages/system/<resource>.vue     # 列表页
shared/types/system.ts            # 各实体 Resp 类型（全局可用，勿在 api 层重复定义）
```

- 统一导入路径 `~/api/system/<resource>`，**禁止 `~/api/modules/...`**（已废弃）。
- 文件保持小而专注；按域/功能组织，不按类型堆叠。

## 数据访问

- 响应信封 `R<T>` 由 `$api` / `useApiFetch` **自动解包**，业务代码直接拿 `T`。
- 分页 `PageResp<T> = { content, totalElements, totalPages, number, size, first, last }`，**`page` 从 0 开始**。
- **读操作一律 `toast: false`**：列表（`useApiFetch`）与 `$api` 的 `getById` 详情、`tree`、`children-ids` 等查询端点都传 `{ toast: false }`，避免读操作弹提示；写操作（增删改）保留默认提示。

### API 层（`app/api/system/<resource>.ts`）

```ts
export interface PostCreateReq { postCode: string, postName: string, orderNum?: number, status?: 'ENABLED' | 'DISABLED', remark?: string }
export interface PostUpdateReq { postName: string, orderNum?: number, status?: 'ENABLED' | 'DISABLED', remark?: string }

export function usePostApi() {
  const { $api } = useNuxtApp()
  return {
    getList: () => $api<PostResp[]>('/v1/system/posts'),
    create: (body: PostCreateReq) => $api<string>('/v1/system/posts', { method: 'POST', body }),
    update: (id: string, body: PostUpdateReq) => $api(`/v1/system/posts/${id}`, { method: 'PUT', body }),
    remove: (id: string) => $api(`/v1/system/posts/${id}`, { method: 'DELETE' }),
    getById: (id: string) => $api<PostResp>(`/v1/system/posts/${id}`, { context: { toast: false } })
  }
}
```

### Composable 层（`app/composables/system/use<X>List.ts`）

以 `useUserList` 为模板：`useApiFetch<PageResp<T>>(url, { query, watch: [query], toast: false })`，返回 `items / total / pending / refresh / query(readonly) / handleCreate/Update/Delete/DeleteBatch / handleSearch / handlePagination`。

```ts
function handleSearch(params: Partial<XListQuery>) {
  query.value = { ...query.value, ...params, page: 0 } // 改条件回到首页
}
function handlePagination(page: number, size: number) {
  query.value = { ...query.value, page, size }
}
```

## CRUD 列表页配方（`user.vue` 为参考）

1. **数据**：`const { items, total, pending, query, handle* } = useXxxList()`。
2. **搜索**：`useAutoForm()` 的 `afz.object({...})` 定义 schema；`<MSearchForm v-model="searchState" :schema :cols="5" @submit="onSearch" @reset="onReset" />`。
3. **工具条**：新增按钮；选中行 > 0 时显示批量删除。
4. **表格**：用 `<AppDataTable>`（封装 MDataTable + 统一工具栏 + 列显隐 + 默认 resizable），新增/批量删除按钮放 `#toolbar-right` 插槽：`<AppDataTable v-model:pagination v-model:row-selection-keys row-key="id" :columns :data :loading :pagination-options="{ manualPagination: true, rowCount: total }"><template #toolbar-right>…</template></AppDataTable>`，分页用 `useTablePagination(query.size ?? 20, handlePagination)`。行选中用 `v-model:row-selection-keys`（`string[]`，以 `row-key` 派生的行 id 数组），配 `const rowSelectionKeys = ref<string[]>([])`，批量删除直接传 `rowSelectionKeys`。
5. **新增/编辑**：`<USlideover>` 容器 + `<MAutoForm :submit="false">`，footer 放取消/保存按钮（保存触发 `formRef?.formRef?.submit()`）。
6. **删除**：用表格 actions 列的 `confirm: true` + `confirmProps`（内置 MessageBox 二次确认），不手写弹窗。

## DataTable 列约束

- **数据列默认不设 `size`**（让表格自适应）。例外：特殊列与需要 `tooltip` / `truncate` 的列给必要 `size`。
- **`selection` 左固定、`actions` 右固定，且都要给 `size`**（否则单元格窄于图标）：`{ type: 'selection', fixed: 'left', size: 48 }`、`{ type: 'actions', fixed: 'right', size: 120, ... }`。
- 长文本列用 `tooltip: true` 或 `truncate`（如 email，配 `size`）。
- **`resizable` 全局开启**（`AppDataTable` 默认 `:resizable="true"`）：数据列默认随内容自适应，拖拽分隔线后才固定为拖拽宽（库内拖拽起始会测量真实宽，无跳变）；`selection` / `actions` 等特殊列默认不可拖拽（避免勾选框错位），需要时按列显式 `resizable: true`。**`sortable` 仅客户端全量表按列开启**（如岗位页）；服务端分页表（如用户页）的排序需后端 `sort` 参数支持，否则只排当前页会误导，暂不开。`visibility` 由 `AppDataTable` 的列设置下拉运行时切换；列级 prop 优先于全局。
- 状态列用 `cell: ({ row }) => h(UBadge, { color, variant: 'subtle' }, () => label)`，颜色/文案取自 `app/constants/system.ts`。
- `emptyCell` 默认值就是 `-`，**禁止 `cell: ({ row }) => row.original.field ?? '-'`**（冗余且不统一）。

## AppDataTable（统一表格工具栏 + 列显隐）

`app/components/AppDataTable.vue` 包装 `MDataTable`：`inheritAttrs:false` + `v-bind="$attrs"` 透传全部 props 与 `v-model:*`，具名插槽透传；顶部一行工具栏含 `#toolbar-left` / `#toolbar-right` 插槽与内置「列设置」`UDropdownMenu`（基于 `tableApi.getAllColumns()` 的 `checkbox` 项，自动排除无文本表头的 selection/actions）；默认 `:resizable="true"`。列表页一律用 `AppDataTable` 取代直接的 `MDataTable`。

## MSearchForm 约束

- **默认 `:cols="x"`** 根据字段个数计算，优先确保 action 对齐最右侧，例如搜索字段为 3，则 `:cols="4"`。
- 字段一律 `.optional()`；枚举用 `afz.enum([...], { type: 'selectMenu', controlProps: { clear: true, valueKey: 'value', items } })`，标签来自 constants。单选 selectMenu 默认加 `clear: true`（`USelectMenu` 自带清除按钮）以便取消筛选。
- state 用 `ref<Partial<SearchSchema>>({})`；`@submit` 收 `FormSubmitEvent<SearchSchema>`。
- 后端无 query 的列表（如 `GET /v1/system/posts`）做**客户端过滤**：`@submit` 写入 `appliedSearch`，`computed` 过滤后喂表格。

## AutoForm 要点（含踩坑结论）

- **编程式提交**：`:submit="false"` + 外部按钮 `@click="formRef?.formRef?.submit()"`。`submit()` **本就会触发校验**，失败时把 inline 错误显示在对应可见字段下，**无需 `@error` 兜底**（`@error` 只用于额外副作用）。
- **类型写法（官方约定）**：

  ```ts
  const schema = afz.object({ /* ... */ })
  type Schema = z.output<typeof schema>
  const state = ref<Partial<Schema>>({})
  function onSubmit(event: FormSubmitEvent<Schema>) { /* event.data: Schema */ }
  ```

- **`meta.if` 控制「渲染 + 校验」**：`if` 结果为 `false` 的字段既不渲染、也不参与校验（由 `pureSchema` 按可见字段裁剪实现）。用于**条件必填/可选字段显隐**，首选配合**静态 schema**：

  ```ts
  password: afz.string({ type: 'withPasswordToggle' }).min(6, '密码至少 6 位')
    .meta({ label: '密码', if: () => !isEditing.value }) // 编辑态隐藏且不校验
  ```

  仅想视觉隐藏但**保留数据与校验**用 `hidden`。
- **动态/联动属性用函数式 `controlProps`**：静态 schema 下，依赖异步数据或其它状态的属性必须写成函数，否则会把初值（如空选项数组）捕获死：

  ```ts
  deptId: afz.enum([], { type: 'selectMenu', controlProps: () => ({ placeholder: '请选择部门', valueKey: 'value', items: deptOptions.value }) }).optional()
  username: afz.string({ controlProps: () => ({ disabled: isEditing.value, placeholder: '请输入用户名' }) })
  ```

- **动态选项字段**：`afz.enum([], { type: 'selectMenu', controlProps })`（空枚举 + items 决定类型与渲染，是官方写法）。
- `validateOn` 默认 `[]`（仅提交时校验）；需要输入即时校验设 `['input', 'blur']`。

## UTree 过滤侧栏配方

点击同一节点会同时「选中 + 切换展开」。要「点击只过滤不折叠」：`@toggle.prevent` 阻止点击改变展开态，展开/折叠改由按钮统一控制（`v-model:expanded`）。

```vue
<UTree
  v-model="selected" v-model:expanded="expandedKeys"
  :items="treeItems" :get-key="(i) => i.value"
  @toggle="(e) => e.preventDefault()"
/>
```

```ts
// Tree.toList 扁平化后节点不含 children 类型，故展开全部节点（展开叶子无副作用）
const allKeys = computed(() => Tree.toList(treeItems.value).map(n => n.value))
const expandedKeys = ref<string[]>([])
watch(allKeys, (keys) => {
  expandedKeys.value = keys
}, { immediate: true })
const allExpanded = computed(() => allKeys.value.length > 0 && expandedKeys.value.length >= allKeys.value.length)
function toggleExpandAll() {
  expandedKeys.value = allExpanded.value ? [] : [...allKeys.value]
}
```

## 工具复用

- 树/数组操作优先 `@movk/core` 的 `Tree`（`Tree.toList` / `Tree.transform` / `Tree.findById`），默认键名 `id` / `children`，**不要自写**。
- 状态/性别等映射集中在 `app/constants/system.ts`（`USER_STATUS_COLOR/LABEL`、`ENABLED_DISABLED_COLOR/LABEL`、`USER_GENDER_LABEL`）。

## 与 @movk/nuxt 库的协作

- 库源码在 `/Users/yixuanmiao/Projects/movk-nuxt`。属于库的 bug（如 AutoForm 校验行为）**在库源头修复**，经 `pkg.pr.new`（CI 在推送后构建）发布新版本后，再把 dashboard 的 `@movk/nuxt` 依赖 bump 到新构建消费，不在 dashboard 做长期 workaround。
- 实现新模块前，用 MCP `read_project_oas_ref_resources_odlgm9` 拉后端 schema，把类型落到 `shared/types/system.ts`。

## 约定

- 不可变更新（spread，勿原地改对象/数组）。
- 注释只写意图，不写装饰性分隔符；不在二次修改里加「修改/优化」字样。
- Conventional Commits（中文描述）；分组提交，勿混合类型。`main` 分支先开特性分支再提交。
- ESLint（仓库 stylistic：`commaDangle: never`、`braceStyle: 1tbs`）+ `nuxi typecheck` 必绿。

## 模块设计文档

全部业务模块的统一需求与设计基准见根目录 `MODULES.md`（按 system / monitor 两域组织，含端点、类型、UI 设计与边界）。
