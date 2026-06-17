import { useConfigApi } from '~/api/system/config'
import type { ConfigCreateReq, ConfigUpdateReq } from '~/api/system/config'

export function useConfigList() {
  const configApi = useConfigApi()

  // /configs 返回全量列表（非分页）
  const { data, pending, refresh } = useApiFetch<ConfigResp[]>('/v1/system/configs', {
    toast: false
  })

  const configs = computed(() => data.value ?? [])

  async function handleCreate(body: ConfigCreateReq) {
    await configApi.create(body)
    await refresh()
  }

  async function handleUpdate(id: string, body: ConfigUpdateReq) {
    await configApi.update(id, body)
    await refresh()
  }

  async function handleDelete(id: string) {
    await configApi.remove(id)
    await refresh()
  }

  async function handleRefreshCache() {
    await configApi.refreshCache()
    await refresh()
  }

  async function getDetail(id: string) {
    return configApi.getById(id)
  }

  return {
    configs,
    pending,
    refresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleRefreshCache,
    getDetail
  }
}
