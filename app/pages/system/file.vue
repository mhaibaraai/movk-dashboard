<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { UBadge } from '#components'
import { useFileApi } from '~/api/system/file'

const {
  files, total, pending, query,
  handleDelete, handleDeleteBatch, handlePagination, handleSearch, refresh, getDetail
} = useFileList()
const fileApi = useFileApi()
const { afz } = useAutoForm()
const { hasPermission } = usePermission()
const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'medium' } })
const toast = useToast()

const pagination = useTablePagination(query.value.size ?? 20, handlePagination)
const rowSelectionKeys = ref<string[]>([])

// 顶部搜索（服务端 query）
const searchSchema = afz.object({
  originalName: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-file', label: '文件名' } }).optional(),
  category: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-folder', label: '分类' } }).optional(),
  contentType: afz.string({ type: 'withFloatingLabel', controlProps: { icon: 'i-lucide-file-type', label: '类型' } }).optional()
})
type FileSearch = z.output<typeof searchSchema>
const searchState = ref<Partial<FileSearch>>({})

function onSearch(event: FormSubmitEvent<FileSearch>) {
  handleSearch(event.data)
}

// 上传
const isUploadOpen = ref(false)
const selectedFiles = ref<File[] | null>(null)
const uploadCategory = ref('')
const { status: uploadStatus, progress: uploadProgress, upload, abort } = useUploadWithProgress<FileUploadResp[]>()

function openUpload() {
  selectedFiles.value = null
  uploadCategory.value = ''
  isUploadOpen.value = true
}

async function onUpload() {
  const files = selectedFiles.value
  if (!files?.length) return
  const { error, data } = await upload(
    fileApi.uploadBatchUrl(uploadCategory.value || undefined),
    files,
    { fieldName: 'files' }
  )
  if (error) return
  const ok = data?.length ?? 0
  const failed = files.length - ok
  if (failed > 0) {
    toast.add({ title: `上传完成：成功 ${ok}，失败 ${failed}`, color: 'warning' })
  }
  await refresh()
  isUploadOpen.value = false
}

// 下载
const { download } = useDownloadWithProgress()
function onDownload(row: FileResp) {
  download(`/v1/system/files/download/${row.id}`, { filename: row.originalName })
}

// 预览
const isPreviewOpen = ref(false)
const previewUrl = ref<string>()
const previewName = ref<string>()

async function onPreview(row: FileResp) {
  if (row.contentType?.startsWith('image/')) {
    const blob = await fileApi.preview(row.id)
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(blob)
    previewName.value = row.originalName
    isPreviewOpen.value = true
  } else {
    toast.add({ title: '该文件类型不支持预览，请下载后查看', color: 'info' })
  }
}

watch(isPreviewOpen, (open) => {
  if (!open && previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = undefined
  }
})

async function onBatchDelete() {
  await handleDeleteBatch(rowSelectionKeys.value)
  rowSelectionKeys.value = []
}

// 详情
const isDetailOpen = ref(false)
const detail = ref<FileResp>()
async function openDetail(id: string) {
  detail.value = await getDetail(id)
  isDetailOpen.value = true
}

const detailItems = computed(() => {
  const d = detail.value
  if (!d) return []
  return [
    { label: '文件名', key: 'originalName', value: d.originalName },
    { label: '存储名', key: 'storageName', value: d.storageName },
    { label: '扩展名', key: 'extension', value: d.extension },
    { label: '类型', key: 'contentType', value: d.contentType },
    { label: '大小', key: 'sizeFormatted', value: d.sizeFormatted },
    { label: '分类', key: 'category', value: d.category },
    { label: '存储类型', key: 'storageType', value: d.storageType },
    { label: 'MD5', key: 'md5', value: d.md5 },
    { label: '路径', key: 'path', value: d.path },
    { label: '下载地址', key: 'downloadUrl', value: d.downloadUrl },
    { label: '备注', key: 'remark', value: d.remark },
    { label: '创建时间', key: 'createdAt', value: formatter.format(formatter.fromISO(d.createdAt)) }
  ]
})

const columns: DataTableColumn<FileResp>[] = [
  { type: 'selection', fixed: 'left', size: 48 },
  { accessorKey: 'originalName', header: '文件名', tooltip: true, size: 240 },
  {
    accessorKey: 'contentType',
    header: '类型',
    cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.contentType ?? '-')
  },
  { accessorKey: 'category', header: '分类' },
  { accessorKey: 'sizeFormatted', header: '大小' },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    cell: ({ row }) => formatter.format(formatter.fromISO(row.original.createdAt))
  },
  {
    type: 'actions',
    fixed: 'right',
    size: 150,
    maxInline: 4,
    actions: [
      {
        key: 'detail',
        visibility: hasPermission('system:file:query'),
        buttonProps: { icon: 'i-lucide-info', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openDetail(row.id)
      },
      {
        key: 'preview',
        buttonProps: { icon: 'i-lucide-eye', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => onPreview(row)
      },
      {
        key: 'download',
        buttonProps: { icon: 'i-lucide-download', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => onDownload(row)
      },
      {
        key: 'delete',
        visibility: hasPermission('system:file:delete'),
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除文件 ${row.originalName}？`,
          description: '删除后无法恢复，请确认。',
          confirmText: '确认删除'
        }),
        onClick: async ({ row }) => {
          await handleDelete(row.id)
        }
      }
    ]
  }
]
</script>

<template>
  <div class="flex flex-col gap-4 min-h-0 flex-1">
    <MSearchForm
      v-model="searchState"
      :schema="searchSchema"
      :global-meta="{ label: '' }"
      :cols="4"
      @submit="onSearch"
      @reset="handleSearch"
    />

    <AppDataTable
      v-model:pagination="pagination"
      v-model:row-selection-keys="rowSelectionKeys"
      row-key="id"
      :columns="columns"
      :data="files"
      :loading="pending"
      :pagination-options="{ manualPagination: true, rowCount: total }"
    >
      <template #toolbar-right>
        <UButton
          v-if="rowSelectionKeys.length > 0"
          v-permission="'system:file:delete'"
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          @click="onBatchDelete"
        >
          批量删除（{{ rowSelectionKeys.length }}）
        </UButton>
        <UButton v-permission="'system:file:create'" icon="i-lucide-upload" @click="openUpload">
          上传文件
        </UButton>
      </template>
    </AppDataTable>

    <USlideover v-model:open="isDetailOpen" title="文件详情" class="w-130">
      <template #body>
        <AppDescriptions v-if="detail" :items="detailItems" />
      </template>
    </USlideover>

    <UModal v-model:open="isUploadOpen" title="上传文件">
      <template #body>
        <div class="flex flex-col gap-4">
          <UInput v-model="uploadCategory" icon="i-lucide-folder" placeholder="文件分类（可选）" />
          <UFileUpload v-model="selectedFiles" multiple :description="'支持多文件上传'" />
          <UProgress v-if="uploadStatus === 'pending'" :model-value="uploadProgress ?? undefined" :max="100" />
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton v-if="uploadStatus === 'pending'" variant="ghost" color="error" @click="abort">
            取消上传
          </UButton>
          <UButton v-else variant="ghost" color="neutral" @click="isUploadOpen = false">
            取消
          </UButton>
          <UButton
            :loading="uploadStatus === 'pending'"
            :disabled="!selectedFiles?.length"
            @click="onUpload"
          >
            开始上传
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isPreviewOpen" :title="previewName" :dismissible="false">
      <template #body>
        <NuxtImg v-if="previewUrl" :src="previewUrl" :alt="previewName" class="mx-auto max-h-[70vh] object-contain" />
      </template>
    </UModal>
  </div>
</template>
