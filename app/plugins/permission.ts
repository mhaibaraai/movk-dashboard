import type { DirectiveBinding } from 'vue'

// 无权限时从 DOM 移除元素；移除发生在客户端 mounted，
// 「绝不可见」的关键操作请改用 v-if="hasPermission(...)"（SSR 安全）
function applyDirective(kind: 'permission' | 'role') {
  return (el: HTMLElement, binding: DirectiveBinding<string | string[]>) => {
    const { hasPermission, hasRole } = usePermission()
    const check = kind === 'role' ? hasRole : hasPermission
    if (!check(binding.value, { every: binding.modifiers.every })) {
      el.parentNode?.removeChild(el)
    }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('permission', { mounted: applyDirective('permission') })
  nuxtApp.vueApp.directive('role', { mounted: applyDirective('role') })
})
