import { useDictApi } from '~/api/system/dict'
import type { DictTypeCreateReq, DictTypeUpdateReq, DictDataCreateReq, DictDataUpdateReq } from '~/api/system/dict'

export function useDictList() {
  const dictApi = useDictApi()

  // 字典类型：全量列表
  const { data: typeData, pending: typePending, refresh: refreshTypes } = useApiFetch<DictTypeResp[]>(
    '/v1/system/dicts/types',
    { toast: false }
  )
  const dictTypes = computed(() => typeData.value ?? [])

  // 字典数据：按选中类型拉取
  const selectedType = ref<string>()
  const { data: dictDataResp, pending: dataPending, refresh: refreshData } = useClientApiFetch<DictDataResp[]>(
    '/v1/system/dicts/data',
    { query: { dictType: selectedType }, immediate: false }
  )
  const dictData = computed(() => dictDataResp.value ?? [])

  async function handleCreateType(body: DictTypeCreateReq) {
    await dictApi.createType(body)
    await refreshTypes()
  }
  async function handleUpdateType(id: string, body: DictTypeUpdateReq) {
    await dictApi.updateType(id, body)
    await refreshTypes()
  }
  async function handleDeleteType(id: string) {
    await dictApi.removeType(id)
    await refreshTypes()
  }
  async function getTypeDetail(id: string) {
    return dictApi.getTypeById(id)
  }

  async function handleCreateData(body: DictDataCreateReq) {
    await dictApi.createData(body)
    await refreshData()
  }
  async function handleUpdateData(id: string, body: DictDataUpdateReq) {
    await dictApi.updateData(id, body)
    await refreshData()
  }
  async function handleDeleteData(id: string) {
    await dictApi.removeData(id)
    await refreshData()
  }
  async function getDataDetail(id: string) {
    return dictApi.getDataById(id)
  }

  async function handleRefreshCache() {
    await dictApi.refreshCache()
  }

  return {
    dictTypes,
    typePending,
    refreshTypes,
    selectedType,
    dictData,
    dataPending,
    refreshData,
    handleCreateType,
    handleUpdateType,
    handleDeleteType,
    getTypeDetail,
    handleCreateData,
    handleUpdateData,
    handleDeleteData,
    getDataDetail,
    handleRefreshCache
  }
}
