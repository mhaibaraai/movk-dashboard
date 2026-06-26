import { Tree } from '@movk/core'
import { useOnlineUserApi } from '~/api/monitor/online-user'

// 首页 KPI 概览：后端无聚合端点，计数前端派生
// 分页端点取 totalElements（size:1），树端点扁平化计数
export interface HomeOverview {
  userCount: number | null
  roleCount: number | null
  deptCount: number | null
  postCount: number | null
  fileCount: number | null
  onlineCount: number | null
}

const emptyOverview: HomeOverview = {
  userCount: null,
  roleCount: null,
  deptCount: null,
  postCount: null,
  fileCount: null,
  onlineCount: null
}

export function useHomeOverview() {
  const { $api } = useNuxtApp()
  const onlineUserApi = useOnlineUserApi()

  // 单个计数失败兜底为 null（页面渲染 -），不阻断整页
  async function pagedTotal(url: string): Promise<number | null> {
    const res = await $api<PageResp<unknown>>(url, {
      query: { page: 0, size: 1 },
      context: { toast: false }
    }).catch(() => null)
    return res?.page?.totalElements ?? null
  }

  async function treeCount(url: string): Promise<number | null> {
    const tree = await $api<DeptResp[]>(url, { context: { toast: false } }).catch(() => null)
    return tree ? Tree.toList(tree).length : null
  }

  const { data, pending, refresh } = useAsyncData<HomeOverview>('home-overview', async () => {
    const [userCount, roleCount, deptCount, postCount, fileCount, onlineCount] = await Promise.all([
      pagedTotal('/v1/system/users'),
      pagedTotal('/v1/system/roles'),
      treeCount('/v1/system/depts/tree'),
      pagedTotal('/v1/system/posts'),
      pagedTotal('/v1/system/files'),
      onlineUserApi.getCount().catch(() => null)
    ])
    return { userCount, roleCount, deptCount, postCount, fileCount, onlineCount }
  }, { default: () => emptyOverview })

  return { overview: data, pending, refresh }
}
