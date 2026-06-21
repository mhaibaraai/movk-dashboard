import { useFileApi } from '~/api/system/file'
import type { FileListQuery } from '~/api/system/file'

export function useFileList() {
  const fileApi = useFileApi()

  const query = ref<FileListQuery>({ page: 0, size: 10 })

  const { data, pending, refresh } = useApiFetch<PageResp<FileResp>>('/v1/system/files', {
    query,
    watch: [query],
    toast: false
  })

  const files = computed(() => data.value?.content ?? [])
  const total = computed(() => data.value?.page?.totalElements ?? 0)

  async function handleDelete(id: string) {
    await fileApi.remove(id)
    await refresh()
  }
  async function handleDeleteBatch(ids: string[]) {
    await fileApi.removeBatch(ids)
    await refresh()
  }

  function handlePagination(page: number, size: number) {
    query.value = { ...query.value, page, size }
  }
  function handleSearch(params: Partial<FileListQuery>) {
    query.value = { ...query.value, ...params, page: 0 }
  }

  return {
    query: readonly(query),
    files,
    total,
    pending,
    refresh,
    handleDelete,
    handleDeleteBatch,
    handlePagination,
    handleSearch
  }
}
