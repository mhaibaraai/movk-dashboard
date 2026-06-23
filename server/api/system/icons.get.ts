import lucide from '@iconify-json/lucide/icons.json'

// 本地自定义 SVG 集合（app/assets/icons），新增 svg 时同步维护此列表。
const CUSTOM_ICONS = [
  'system', 'monitor', 'user', 'peoples', 'tree-table', 'tree', 'post',
  'dict', 'message', 'upload', 'edit', 'online', 'log', 'form'
]

// 返回可供 IconPicker 选择的图标，按集合分组：
// custom 为本地自定义 SVG，lucide 为已安装的 lucide 图标集（仅服务端解析 icons.json）。
export default defineCachedEventHandler(() => {
  const { icons } = lucide as { icons: Record<string, unknown> }
  return {
    custom: CUSTOM_ICONS.map(name => `i-custom-${name}`),
    lucide: Object.keys(icons).map(name => `i-lucide-${name}`)
  }
}, { maxAge: 60 * 60 })
