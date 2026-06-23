import type { Directive } from 'vue'

// 全局权限指令类型：v-permission / v-role 由 app/plugins/permission.ts 注册
declare module 'vue' {
  interface GlobalDirectives {
    vPermission: Directive<HTMLElement, string | string[]>
    vRole: Directive<HTMLElement, string | string[]>
  }
}

export {}
