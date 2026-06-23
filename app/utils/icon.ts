// 防御性兜底：历史数据若仍存裸图标名（如 system / peoples），补全本地 custom 集合前缀。
// 已带集合前缀（i-xxx）或 iconify 全名（collection:name）的值原样返回。
export function normalizeIconName(icon?: string | null): string | undefined {
  const name = icon?.trim()
  if (!name) return undefined
  if (name.startsWith('i-') || name.includes(':')) return name
  return `i-custom-${name}`
}
