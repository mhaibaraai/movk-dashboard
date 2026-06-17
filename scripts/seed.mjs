// 演示数据灌入脚本：为 MovkRBACAPI 后端各模块创建中量演示数据。
// 基础模式（pnpm seed）：幂等，按唯一键判重，重复运行不产生重复数据。
// 追加模式（pnpm seed:more [count]）：每次运行生成一批全新唯一数据（用户/公告/文件 + 登录活动）。
// 可用环境变量覆盖 NUXT_API_BASE / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD

const BASE = (process.env.NUXT_API_BASE || 'https://server.mhaibaraai.cn/movk-backend').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@movk.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@2025#Secure'
const SEED_USER_PASSWORD = 'Movk@2025#Seed'

const MODE = process.argv[2] === 'batch' ? 'batch' : 'base'
const BATCH_COUNT = Math.max(1, Number(process.argv[3]) || 20)

let token = ''

function buildUrl(path, query) {
  const url = new URL(BASE + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

async function request(method, path, { body, query, raw } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const init = { method, headers }
  if (raw) {
    init.body = raw
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetch(buildUrl(path, query), init)
  let payload
  try {
    payload = await res.json()
  } catch {
    payload = {}
  }
  const code = payload?.code
  const ok = res.ok && (code === undefined || code === 200 || code === 0)
  if (!ok) {
    const msg = payload?.message || payload?.msg || res.statusText
    throw new Error(`${method} ${path} -> HTTP ${res.status} code=${code} ${msg}`)
  }
  return payload?.data
}

const get = (path, query) => request('GET', path, { query })
const post = (path, body, query) => request('POST', path, { body, query })

function flattenTree(nodes, out = []) {
  for (const n of nodes || []) {
    out.push(n)
    if (n.children?.length) flattenTree(n.children, out)
  }
  return out
}

async function login() {
  const url = buildUrl('/v1/auth/login')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, rememberMe: false })
  })
  const payload = await res.json().catch(() => ({}))
  const data = payload?.data
  if (!res.ok || !data?.access_token) {
    throw new Error(`登录失败: HTTP ${res.status} ${payload?.message || res.statusText}`)
  }
  return data.access_token
}

const stats = {}
function track(module, key) {
  const s = stats[module] || (stats[module] = { created: 0, skipped: 0, failed: 0 })
  s[key] += 1
}

// 部门树（先父后子），deptCode 唯一
const deptTree = [
  {
    deptName: '总公司', deptCode: 'HQ', orderNum: 1, phone: '010-88888888', email: 'hq@movk.com',
    children: [
      {
        deptName: '研发中心', deptCode: 'RD', orderNum: 1, phone: '010-88880001', email: 'rd@movk.com',
        children: [
          { deptName: '前端组', deptCode: 'RD-FE', orderNum: 1 },
          { deptName: '后端组', deptCode: 'RD-BE', orderNum: 2 },
          { deptName: '测试组', deptCode: 'RD-QA', orderNum: 3 }
        ]
      },
      { deptName: '市场部', deptCode: 'MKT', orderNum: 2, phone: '010-88880002' },
      { deptName: '财务部', deptCode: 'FIN', orderNum: 3, phone: '010-88880003' },
      { deptName: '人事行政部', deptCode: 'HR', orderNum: 4, phone: '010-88880004' },
      { deptName: '运维部', deptCode: 'OPS', orderNum: 5, phone: '010-88880005' }
    ]
  }
]

const deptIdByCode = {}

async function seedDepts() {
  const tree = await get('/v1/system/depts/tree').catch(() => [])
  const existing = new Map(flattenTree(tree).map(d => [d.deptCode, d.id]))

  async function walk(nodes, parentId) {
    for (const node of nodes) {
      const { children, ...rest } = node
      let id = existing.get(rest.deptCode)
      if (id) {
        track('部门', 'skipped')
      } else {
        try {
          id = await post('/v1/system/depts', { ...rest, parentId, status: 'ENABLED' })
          track('部门', 'created')
        } catch (e) {
          track('部门', 'failed')
          console.warn('  部门失败:', e.message)
          continue
        }
      }
      deptIdByCode[rest.deptCode] = id
      if (children?.length) await walk(children, id)
    }
  }
  await walk(deptTree, undefined)
}

// 岗位，postCode 唯一
const posts = [
  { postCode: 'ceo', postName: '董事长', orderNum: 1 },
  { postCode: 'gm', postName: '总经理', orderNum: 2 },
  { postCode: 'cto', postName: '技术总监', orderNum: 3 },
  { postCode: 'pm', postName: '项目经理', orderNum: 4 },
  { postCode: 'senior_dev', postName: '高级工程师', orderNum: 5 },
  { postCode: 'dev', postName: '工程师', orderNum: 6 },
  { postCode: 'hr', postName: '人事专员', orderNum: 7 },
  { postCode: 'finance', postName: '财务专员', orderNum: 8 }
]

const postIdByCode = {}

async function seedPosts() {
  const list = await get('/v1/system/posts').catch(() => [])
  // 唯一约束大小写不敏感，按小写键判重并复用已有内置岗位
  const existing = new Map((list || []).map(p => [p.postCode.toLowerCase(), p.id]))
  for (const p of posts) {
    let id = existing.get(p.postCode.toLowerCase())
    if (id) {
      track('岗位', 'skipped')
    } else {
      try {
        id = await post('/v1/system/posts', { ...p, status: 'ENABLED', remark: `${p.postName}岗位` })
        track('岗位', 'created')
      } catch (e) {
        track('岗位', 'failed')
        console.warn('  岗位失败:', e.message)
        continue
      }
    }
    postIdByCode[p.postCode] = id
  }
}

// 菜单树。目录/菜单按 name 判重，按钮按 permissionCode 判重
function menu(name, icon, path, component, perm, buttons) {
  return {
    type: 'MENU', name, icon, path, component, permissionCode: perm,
    children: (buttons || []).map(b => ({ type: 'BUTTON', name: b.name, permissionCode: b.code }))
  }
}

const menuTree = [
  {
    type: 'DIRECTORY', name: '系统管理', icon: 'i-lucide-settings', path: '/system', orderNum: 1,
    children: [
      menu('用户管理', 'i-lucide-users', '/system/user', 'system/user', 'system:user:list', [
        { name: '新增', code: 'system:user:create' }, { name: '编辑', code: 'system:user:update' }, { name: '删除', code: 'system:user:delete' }
      ]),
      menu('角色管理', 'i-lucide-shield', '/system/role', 'system/role', 'system:role:list', [
        { name: '新增', code: 'system:role:create' }, { name: '编辑', code: 'system:role:update' }, { name: '删除', code: 'system:role:delete' }
      ]),
      menu('菜单管理', 'i-lucide-menu', '/system/menu', 'system/menu', 'system:menu:list', [
        { name: '新增', code: 'system:menu:create' }, { name: '编辑', code: 'system:menu:update' }, { name: '删除', code: 'system:menu:delete' }
      ]),
      menu('部门管理', 'i-lucide-network', '/system/dept', 'system/dept', 'system:dept:list', [
        { name: '新增', code: 'system:dept:create' }, { name: '删除', code: 'system:dept:delete' }
      ]),
      menu('岗位管理', 'i-lucide-briefcase', '/system/post', 'system/post', 'system:post:list', [
        { name: '新增', code: 'system:post:create' }, { name: '删除', code: 'system:post:delete' }
      ]),
      menu('字典管理', 'i-lucide-book', '/system/dict', 'system/dict', 'system:dict:list', [
        { name: '新增', code: 'system:dict:create' }, { name: '删除', code: 'system:dict:delete' }
      ]),
      menu('系统配置', 'i-lucide-sliders', '/system/config', 'system/config', 'system:config:list', [
        { name: '新增', code: 'system:config:create' }, { name: '删除', code: 'system:config:delete' }
      ]),
      menu('通知公告', 'i-lucide-bell', '/system/notice', 'system/notice', 'system:notice:list', [
        { name: '新增', code: 'system:notice:create' }, { name: '删除', code: 'system:notice:delete' }
      ]),
      menu('文件管理', 'i-lucide-folder', '/system/file', 'system/file', 'system:file:list', [
        { name: '上传', code: 'system:file:upload' }, { name: '删除', code: 'system:file:delete' }
      ])
    ]
  },
  {
    type: 'DIRECTORY', name: '系统监控', icon: 'i-lucide-activity', path: '/monitor', orderNum: 2,
    children: [
      menu('操作日志', 'i-lucide-file-text', '/monitor/operate-log', 'monitor/operate-log', 'monitor:operlog:list', []),
      menu('登录日志', 'i-lucide-log-in', '/monitor/login-log', 'monitor/login-log', 'monitor:loginlog:list', []),
      menu('在线用户', 'i-lucide-user-check', '/monitor/online-user', 'monitor/online-user', 'monitor:online:list', [
        { name: '强制下线', code: 'monitor:online:forceLogout' }
      ])
    ]
  }
]

const allMenuIds = []

function menuKey(node) {
  return node.type === 'BUTTON' ? `btn:${node.permissionCode}` : `nav:${node.name}`
}

async function seedMenus() {
  const tree = await get('/v1/system/menus/tree').catch(() => [])
  const existing = new Map(flattenTree(tree).map(m => [menuKey(m), m.id]))

  async function walk(nodes, parentId, orderBase) {
    let order = orderBase
    for (const node of nodes) {
      order += 1
      const { children, ...rest } = node
      let id = existing.get(menuKey(node))
      if (id) {
        track('菜单', 'skipped')
      } else {
        try {
          const body = {
            ...rest, parentId, orderNum: rest.orderNum ?? order,
            status: 'ENABLED', visible: rest.type !== 'BUTTON'
          }
          id = await post('/v1/system/menus', body)
          track('菜单', 'created')
        } catch (e) {
          track('菜单', 'failed')
          console.warn('  菜单失败:', e.message)
          continue
        }
      }
      allMenuIds.push(id)
      if (children?.length) await walk(children, id, 0)
    }
  }
  await walk(menuTree, undefined, 0)
}

// 角色，code 唯一
const roles = [
  { code: 'sys_admin', name: '系统管理员', roleSort: 1, dataScope: 'ALL', remark: '拥有全部菜单权限', assignAll: true },
  { code: 'ops_admin', name: '运维管理员', roleSort: 2, dataScope: 'ALL', remark: '系统监控与运维' },
  { code: 'dept_manager', name: '部门主管', roleSort: 3, dataScope: 'DEPT_AND_CHILD', remark: '管理本部门及下级' },
  { code: 'normal_user', name: '普通用户', roleSort: 4, dataScope: 'SELF', remark: '仅查看本人数据' },
  { code: 'guest', name: '访客', roleSort: 5, dataScope: 'SELF', status: 'DISABLED', remark: '只读访客' }
]

const roleIdByCode = {}

async function seedRoles() {
  const page = await get('/v1/system/roles', { page: 0, size: 100 }).catch(() => ({ content: [] }))
  const existing = new Map((page?.content || []).map(r => [r.code, r.id]))
  for (const r of roles) {
    const { assignAll, ...rest } = r
    let id = existing.get(r.code)
    if (id) {
      track('角色', 'skipped')
    } else {
      try {
        id = await post('/v1/system/roles', { ...rest, status: rest.status || 'ENABLED', roleType: 'CUSTOM' })
        track('角色', 'created')
      } catch (e) {
        track('角色', 'failed')
        console.warn('  角色失败:', e.message)
        continue
      }
    }
    roleIdByCode[r.code] = id
    if (assignAll && id && allMenuIds.length) {
      await post(`/v1/system/roles/${id}/menus`, allMenuIds).catch(e => console.warn('  分配菜单失败:', e.message))
    }
  }
}

// 用户，username 唯一
const users = [
  { username: 'zhangsan', nickname: '张三', gender: 'MALE', deptCode: 'RD-FE', roles: ['sys_admin'], posts: ['cto'] },
  { username: 'lisi', nickname: '李四', gender: 'MALE', deptCode: 'RD-BE', roles: ['dept_manager'], posts: ['pm'] },
  { username: 'wangwu', nickname: '王五', gender: 'MALE', deptCode: 'RD-BE', roles: ['normal_user'], posts: ['senior_dev'] },
  { username: 'zhaoliu', nickname: '赵六', gender: 'FEMALE', deptCode: 'RD-FE', roles: ['normal_user'], posts: ['dev'] },
  { username: 'sunqi', nickname: '孙七', gender: 'MALE', deptCode: 'RD-QA', roles: ['normal_user'], posts: ['dev'] },
  { username: 'zhouba', nickname: '周八', gender: 'FEMALE', deptCode: 'MKT', roles: ['normal_user'], posts: ['gm'] },
  { username: 'wujiu', nickname: '吴九', gender: 'MALE', deptCode: 'MKT', roles: ['normal_user'], posts: ['dev'], status: 'DISABLED' },
  { username: 'zhengshi', nickname: '郑十', gender: 'FEMALE', deptCode: 'FIN', roles: ['normal_user'], posts: ['finance'] },
  { username: 'qianyi', nickname: '钱一', gender: 'MALE', deptCode: 'FIN', roles: ['normal_user'], posts: ['finance'] },
  { username: 'sunlei', nickname: '孙磊', gender: 'MALE', deptCode: 'HR', roles: ['dept_manager'], posts: ['hr'] },
  { username: 'lina', nickname: '李娜', gender: 'FEMALE', deptCode: 'HR', roles: ['normal_user'], posts: ['hr'] },
  { username: 'opsadmin', nickname: '运维管理', gender: 'MALE', deptCode: 'OPS', roles: ['ops_admin'], posts: ['senior_dev'] },
  { username: 'liuyang', nickname: '刘洋', gender: 'MALE', deptCode: 'OPS', roles: ['normal_user'], posts: ['dev'], status: 'LOCKED' },
  { username: 'chenjing', nickname: '陈静', gender: 'FEMALE', deptCode: 'RD-QA', roles: ['normal_user'], posts: ['dev'] },
  { username: 'guest01', nickname: '访客一', gender: 'UNKNOWN', deptCode: 'HQ', roles: ['guest'], posts: [] }
]

const seededUserEmails = []

async function seedUsers() {
  const page = await get('/v1/system/users', { page: 0, size: 200 }).catch(() => ({ content: [] }))
  const existing = new Map((page?.content || []).map(u => [u.username, u.id]))
  for (const u of users) {
    const email = `${u.username}@movk.com`
    const phone = `139${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`
    let id = existing.get(u.username)
    if (id) {
      track('用户', 'skipped')
    } else {
      try {
        id = await post('/v1/system/users', {
          username: u.username, password: SEED_USER_PASSWORD, nickname: u.nickname,
          email, phone, gender: u.gender, status: u.status || 'ACTIVE',
          deptId: deptIdByCode[u.deptCode], remark: `${u.nickname}（演示账号）`
        })
        track('用户', 'created')
      } catch (e) {
        track('用户', 'failed')
        console.warn('  用户失败:', e.message)
        continue
      }
    }
    if (!id) continue
    if ((u.status || 'ACTIVE') === 'ACTIVE') seededUserEmails.push(email)
    const roleIds = u.roles.map(c => roleIdByCode[c]).filter(Boolean)
    const postIds = u.posts.map(c => postIdByCode[c]).filter(Boolean)
    if (roleIds.length) await post(`/v1/system/users/${id}/roles`, roleIds).catch(e => console.warn('  分配角色失败:', e.message))
    if (postIds.length) await post(`/v1/system/users/${id}/posts`, postIds).catch(e => console.warn('  分配岗位失败:', e.message))
  }
}

// 字典类型 + 数据
const dicts = [
  {
    dictName: '用户性别', dictType: 'sys_user_sex', data: [
      { dictLabel: '男', dictValue: 'MALE', dictSort: 1, listClass: 'primary', isDefault: true },
      { dictLabel: '女', dictValue: 'FEMALE', dictSort: 2, listClass: 'danger' },
      { dictLabel: '未知', dictValue: 'UNKNOWN', dictSort: 3, listClass: 'default' }
    ]
  },
  {
    dictName: '系统开关', dictType: 'sys_normal_disable', data: [
      { dictLabel: '正常', dictValue: 'ENABLED', dictSort: 1, listClass: 'success', isDefault: true },
      { dictLabel: '停用', dictValue: 'DISABLED', dictSort: 2, listClass: 'danger' }
    ]
  },
  {
    dictName: '系统是否', dictType: 'sys_yes_no', data: [
      { dictLabel: '是', dictValue: 'Y', dictSort: 1, listClass: 'primary', isDefault: true },
      { dictLabel: '否', dictValue: 'N', dictSort: 2, listClass: 'default' }
    ]
  },
  {
    dictName: '通知类型', dictType: 'sys_notice_type', data: [
      { dictLabel: '通知', dictValue: 'NOTICE', dictSort: 1, listClass: 'info', isDefault: true },
      { dictLabel: '公告', dictValue: 'ANNOUNCEMENT', dictSort: 2, listClass: 'warning' }
    ]
  },
  {
    dictName: '操作类型', dictType: 'sys_oper_type', data: [
      { dictLabel: '新增', dictValue: 'CREATE', dictSort: 1, listClass: 'success' },
      { dictLabel: '修改', dictValue: 'UPDATE', dictSort: 2, listClass: 'info' },
      { dictLabel: '删除', dictValue: 'DELETE', dictSort: 3, listClass: 'danger' }
    ]
  }
]

async function seedDicts() {
  const types = await get('/v1/system/dicts/types').catch(() => [])
  const existingTypes = new Set((types || []).map(t => t.dictType))
  for (const d of dicts) {
    if (existingTypes.has(d.dictType)) {
      track('字典类型', 'skipped')
    } else {
      try {
        await post('/v1/system/dicts/types', { dictName: d.dictName, dictType: d.dictType, status: 'ENABLED' })
        track('字典类型', 'created')
      } catch (e) {
        track('字典类型', 'failed')
        console.warn('  字典类型失败:', e.message)
        continue
      }
    }
    const data = await get('/v1/system/dicts/data', { dictType: d.dictType }).catch(() => [])
    const existingData = new Set((data || []).map(x => x.dictValue))
    for (const item of d.data) {
      if (existingData.has(item.dictValue)) {
        track('字典数据', 'skipped')
        continue
      }
      try {
        await post('/v1/system/dicts/data', { ...item, dictType: d.dictType, status: 'ENABLED' })
        track('字典数据', 'created')
      } catch (e) {
        track('字典数据', 'failed')
        console.warn('  字典数据失败:', e.message)
      }
    }
  }
}

// 系统配置，configKey 唯一
const configs = [
  { configName: '主题皮肤', configKey: 'sys.index.skinName', configValue: 'skin-blue', remark: '后台主题颜色' },
  { configName: '系统名称', configKey: 'sys.system.name', configValue: 'Movk Dashboard', remark: '系统展示名称' },
  { configName: '用户初始密码', configKey: 'sys.user.initPassword', configValue: '123456', remark: '新建用户默认密码' },
  { configName: '验证码开关', configKey: 'sys.account.captchaEnabled', configValue: 'true', remark: '登录是否启用验证码' },
  { configName: '上传大小限制', configKey: 'sys.upload.maxSize', configValue: '10', remark: '单文件上传上限（MB）' },
  { configName: '会话超时', configKey: 'sys.session.timeout', configValue: '30', remark: '无操作自动登出（分钟）' }
]

async function seedConfigs() {
  const list = await get('/v1/system/configs').catch(() => [])
  const existing = new Set((list || []).map(c => c.configKey))
  for (const c of configs) {
    if (existing.has(c.configKey)) {
      track('配置', 'skipped')
      continue
    }
    try {
      await post('/v1/system/configs', { ...c, configType: 'CUSTOM' })
      track('配置', 'created')
    } catch (e) {
      track('配置', 'failed')
      console.warn('  配置失败:', e.message)
    }
  }
}

// 通知公告，noticeTitle 唯一
const notices = [
  { noticeTitle: '系统上线公告', noticeType: 'ANNOUNCEMENT', noticeContent: 'Movk Dashboard 管理后台已正式上线，欢迎使用。' },
  { noticeTitle: '本周五系统维护通知', noticeType: 'NOTICE', noticeContent: '本周五 22:00-23:00 进行系统维护，期间服务可能短暂不可用。' },
  { noticeTitle: '新功能：系统监控模块', noticeType: 'ANNOUNCEMENT', noticeContent: '新增操作日志、登录日志、在线用户监控能力。' },
  { noticeTitle: '安全提醒：请定期修改密码', noticeType: 'NOTICE', noticeContent: '为保障账号安全，建议每 90 天更换一次登录密码。' },
  { noticeTitle: '历史公告（已停用）', noticeType: 'NOTICE', noticeContent: '该公告已下线，仅作演示。', status: 'DISABLED' }
]

async function seedNotices() {
  const page = await get('/v1/system/notices', { page: 0, size: 100 }).catch(() => ({ content: [] }))
  const existing = new Set((page?.content || []).map(n => n.noticeTitle))
  for (const n of notices) {
    if (existing.has(n.noticeTitle)) {
      track('公告', 'skipped')
      continue
    }
    try {
      await post('/v1/system/notices', { ...n, status: n.status || 'ENABLED' })
      track('公告', 'created')
    } catch (e) {
      track('公告', 'failed')
      console.warn('  公告失败:', e.message)
    }
  }
}

// 文件：内存生成小文件后 multipart 上传
const files = [
  { name: 'readme.txt', type: 'text/plain', category: 'document', content: 'Movk Dashboard 演示文本文件。\n第二行内容。\n' },
  { name: 'demo-config.json', type: 'application/json', category: 'document', content: JSON.stringify({ name: 'movk', version: '1.0.0', demo: true }, null, 2) },
  { name: 'users-sample.csv', type: 'text/csv', category: 'export', content: 'username,nickname,dept\nzhangsan,张三,前端组\nlisi,李四,后端组\n' },
  { name: 'changelog.md', type: 'text/markdown', category: 'document', content: '# 更新日志\n\n- 初始化演示数据\n- 接入系统监控模块\n' }
]

async function seedFiles() {
  const page = await get('/v1/system/files', { page: 0, size: 200 }).catch(() => ({ content: [] }))
  const existing = new Set((page?.content || []).map(f => f.originalName))
  for (const f of files) {
    if (existing.has(f.name)) {
      track('文件', 'skipped')
      continue
    }
    try {
      const form = new FormData()
      form.append('file', new Blob([f.content], { type: f.type }), f.name)
      await request('POST', '/v1/system/files/upload', { raw: form, query: { category: f.category } })
      track('文件', 'created')
    } catch (e) {
      track('文件', 'failed')
      console.warn('  文件失败:', e.message)
    }
  }
}

// 顺带产生登录日志 / 在线用户：用部分种子账号登录，并制造一次失败登录
async function seedLogins() {
  const targets = seededUserEmails.slice(0, 3)
  for (const email of targets) {
    for (let i = 0; i < 2; i++) {
      const res = await fetch(buildUrl('/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: SEED_USER_PASSWORD, rememberMe: i === 0 })
      }).catch(() => null)
      if (res?.ok) track('登录会话', 'created')
      else track('登录会话', 'failed')
    }
  }
  // 一次失败登录用于产生 FAILURE 登录日志
  await fetch(buildUrl('/v1/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: 'WrongPassword#000', rememberMe: false })
  }).catch(() => null)
}

// ── 追加模式：每次运行生成一批全新唯一数据 ──

const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜'.split('')
const GIVEN = '伟芳娜秀英敏静丽强磊洋勇艳杰娟涛明超霞平刚桂英文军建华'.split('')
const GENDERS = ['MALE', 'FEMALE', 'UNKNOWN']

const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const randomName = () => pick(SURNAMES) + pick(GIVEN) + (Math.random() < 0.4 ? pick(GIVEN) : '')
const randomPhone = () => `13${Math.floor(Math.random() * 9) + 1}${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`

// 从后端拉取部门/角色/岗位映射，供批量分配引用
async function loadRefs() {
  const tree = await get('/v1/system/depts/tree').catch(() => [])
  for (const d of flattenTree(tree)) if (d.deptCode) deptIdByCode[d.deptCode] = d.id
  const rolePage = await get('/v1/system/roles', { page: 0, size: 100 }).catch(() => ({ content: [] }))
  for (const r of rolePage?.content || []) roleIdByCode[r.code] = r.id
  const postList = await get('/v1/system/posts').catch(() => [])
  for (const p of postList || []) postIdByCode[p.postCode] = p.id
}

async function seedUserBatch(count, stamp) {
  const deptIds = Object.values(deptIdByCode)
  const roleIds = Object.values(roleIdByCode)
  const postIds = Object.values(postIdByCode)
  const newEmails = []
  for (let i = 1; i <= count; i++) {
    const username = `demo_${stamp}_${i}`
    const email = `${username}@movk.com`
    const status = Math.random() < 0.12 ? pick(['DISABLED', 'LOCKED']) : 'ACTIVE'
    try {
      const id = await post('/v1/system/users', {
        username, password: SEED_USER_PASSWORD, nickname: randomName(),
        email, phone: randomPhone(), gender: pick(GENDERS), status,
        deptId: deptIds.length ? pick(deptIds) : undefined, remark: '批量演示账号'
      })
      track('用户', 'created')
      if (roleIds.length) await post(`/v1/system/users/${id}/roles`, [pick(roleIds)]).catch(() => {})
      if (postIds.length) await post(`/v1/system/users/${id}/posts`, [pick(postIds)]).catch(() => {})
      if (status === 'ACTIVE') newEmails.push(email)
    } catch (e) {
      track('用户', 'failed')
      console.warn('  用户失败:', e.message)
    }
  }
  return newEmails
}

async function seedNoticeBatch(stamp) {
  const types = ['NOTICE', 'ANNOUNCEMENT']
  for (let i = 1; i <= 3; i++) {
    try {
      await post('/v1/system/notices', {
        noticeTitle: `批量公告 ${stamp}-${i}`, noticeType: pick(types),
        noticeContent: `这是第 ${stamp}-${i} 条批量生成的演示公告内容。`, status: 'ENABLED'
      })
      track('公告', 'created')
    } catch (e) {
      track('公告', 'failed')
      console.warn('  公告失败:', e.message)
    }
  }
}

async function seedFileBatch(stamp) {
  const items = [
    { ext: 'txt', type: 'text/plain', category: 'document', content: `批量文本 ${stamp}` },
    { ext: 'json', type: 'application/json', category: 'export', content: JSON.stringify({ stamp, demo: true }) }
  ]
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    try {
      const form = new FormData()
      form.append('file', new Blob([it.content], { type: it.type }), `batch_${stamp}_${i + 1}.${it.ext}`)
      await request('POST', '/v1/system/files/upload', { raw: form, query: { category: it.category } })
      track('文件', 'created')
    } catch (e) {
      track('文件', 'failed')
      console.warn('  文件失败:', e.message)
    }
  }
}

async function seedLoginActivity(emails) {
  for (const email of emails.slice(0, 5)) {
    const res = await fetch(buildUrl('/v1/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: SEED_USER_PASSWORD, rememberMe: Math.random() < 0.5 })
    }).catch(() => null)
    track('登录会话', res?.ok ? 'created' : 'failed')
  }
}

const steps = [
  ['部门', seedDepts],
  ['岗位', seedPosts],
  ['菜单', seedMenus],
  ['角色', seedRoles],
  ['用户', seedUsers],
  ['字典', seedDicts],
  ['配置', seedConfigs],
  ['公告', seedNotices],
  ['文件', seedFiles],
  ['登录日志/在线用户', seedLogins]
]

async function runBatch() {
  const stamp = Date.now().toString(36)
  console.log(`追加批量数据（批次 ${stamp}，用户数量 ${BATCH_COUNT}）\n`)
  await loadRefs()
  process.stdout.write('▶ 用户 ...\n')
  const emails = await seedUserBatch(BATCH_COUNT, stamp)
  process.stdout.write('▶ 公告 ...\n')
  await seedNoticeBatch(stamp)
  process.stdout.write('▶ 文件 ...\n')
  await seedFileBatch(stamp)
  process.stdout.write('▶ 登录活动 ...\n')
  await seedLoginActivity(emails)
}

async function main() {
  console.log(`目标后端: ${BASE}`)
  token = await login()
  console.log(`管理员登录成功 (${ADMIN_EMAIL})\n`)
  if (MODE === 'batch') {
    await runBatch()
  } else {
    for (const [label, fn] of steps) {
      process.stdout.write(`▶ ${label} ...\n`)
      await fn()
    }
  }
  console.log('\n===== 汇总 =====')
  for (const [module, s] of Object.entries(stats)) {
    console.log(`  ${module}: 新建 ${s.created} / 跳过 ${s.skipped}${s.failed ? ` / 失败 ${s.failed}` : ''}`)
  }
  console.log(`\n种子用户统一密码: ${SEED_USER_PASSWORD}（仅演示用）`)
}

main().catch((e) => {
  console.error('\n执行中断:', e.message)
  process.exit(1)
})
