// 路由 → 页面访问所需权限码（permission.global 消费，单一来源）
export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/system/user': 'system:user:list',
  '/system/role': 'system:role:list',
  '/system/dept': 'system:dept:list',
  '/system/menu': 'system:menu:list',
  '/system/post': 'system:post:list',
  '/system/dict': 'system:dict:list',
  '/system/config': 'system:config:list',
  '/system/notice': 'system:notice:list',
  '/system/file': 'system:file:list',
  '/monitor/operate-log': 'monitor:operateLog:list',
  '/monitor/login-log': 'monitor:loginLog:list',
  '/monitor/online': 'monitor:online:list'
}
