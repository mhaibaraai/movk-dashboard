<script setup lang="ts">
import type { DataTableColumn } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { UBadge } from '#components'
import { useFileApi } from '~/api/system/file'

const {
  files, total, pending, query,
  handleDelete, handleDeleteBatch, handlePagination, handleSearch, refresh
} = useFileList()
const fileApi = useFileApi()
const { afz } = useAutoForm()
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
const { status: uploadStatus, progress: uploadProgress, upload } = useUploadWithProgress()

function openUpload() {
  selectedFiles.value = null
  isUploadOpen.value = true
}

async function onUpload() {
  if (!selectedFiles.value?.length) return
  for (const file of selectedFiles.value) {
    const { error } = await upload('/v1/system/files/upload', file, { fieldName: 'file' })
    if (error) return
  }
  isUploadOpen.value = false
  await refresh()
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
    onDownload(row)
    toast.add({ title: '该文件类型不支持预览，已开始下载', color: 'info' })
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
    size: 140,
    actions: [
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
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          @click="onBatchDelete"
        >
          批量删除（{{ rowSelectionKeys.length }}）
        </UButton>
        <UButton icon="i-lucide-upload" @click="openUpload">
          上传文件
        </UButton>
      </template>
    </AppDataTable>

    <UModal v-model:open="isUploadOpen" title="上传文件">
      <template #body>
        <div class="flex flex-col gap-4">
          <UFileUpload v-model="selectedFiles" multiple :description="'支持多文件上传'" />
          <UProgress v-if="uploadStatus === 'pending'" :model-value="uploadProgress ?? undefined" :max="100" />
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="isUploadOpen = false">
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

    <UModal v-model:open="isPreviewOpen" :title="previewName">
      <template #body>
        <img v-if="previewUrl" :src="previewUrl" :alt="previewName" class="mx-auto max-h-[70vh] object-contain">
      </template>
    </UModal>
  </div>
</template>
