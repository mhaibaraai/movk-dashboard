<script setup lang="ts">
import { DICT_TYPE } from '~/constants/dict'
import { useNoticeApi } from '~/api/system/notice'

const formatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium' } })
const detailFormatter = useDateFormatter({ locale: 'zh-CN', formatOptions: { dateStyle: 'medium', timeStyle: 'short' } })
const noticeTypeDict = useDict(DICT_TYPE.noticeType)
const noticeApi = useNoticeApi()

// 已启用公告（首页/前台用），后端返回全量启用列表
const { data, pending } = useApiFetch<NoticeResp[]>('/v1/system/notices/published', {
  toast: false
})

const mounted = useMounted()
const loading = computed(() => !mounted.value || pending.value)
const notices = computed(() => (data.value ?? []).slice(0, 6))

const isOpen = ref(false)
const detail = ref<NoticeResp>()

async function openDetail(notice: NoticeResp) {
  // published 列表通常已含正文，缺失时按 id 兜底拉取
  detail.value = notice.noticeContent != null
    ? notice
    : await noticeApi.getById(notice.id).catch(() => notice)
  isOpen.value = true
}
</script>

<template>
  <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-megaphone" class="size-5 text-primary" />
        <span class="font-medium">最新公告</span>
        <ULink to="/system/notice" class="ml-auto text-sm text-muted hover:text-primary">查看全部</ULink>
      </div>
    </template>

    <div v-if="loading" class="flex flex-col gap-3 p-4">
      <USkeleton v-for="i in 4" :key="i" class="h-10 w-full" />
    </div>
    <div v-else-if="!notices.length" class="p-6 text-center text-sm text-muted">
      暂无公告
    </div>
    <ul v-else class="divide-y divide-default">
      <li
        v-for="notice in notices"
        :key="notice.id"
        class="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated"
        @click="openDetail(notice)"
      >
        <UBadge :color="noticeTypeDict.getColor(notice.noticeType)" variant="subtle" size="sm" class="shrink-0">
          {{ noticeTypeDict.getLabel(notice.noticeType) }}
        </UBadge>
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm font-medium">{{ notice.noticeTitle }}</span>
          <span v-if="notice.noticeContent" class="truncate text-xs text-muted">{{ notice.noticeContent }}</span>
        </div>
        <span class="shrink-0 whitespace-nowrap text-xs text-muted">{{ formatter.format(formatter.fromISO(notice.createdAt)) }}</span>
      </li>
    </ul>

    <UModal v-model:open="isOpen" :title="detail?.noticeTitle" :ui="{ content: 'max-w-2xl' }">
      <template #body>
        <div v-if="detail" class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <UBadge :color="noticeTypeDict.getColor(detail.noticeType)" variant="subtle" size="sm">
              {{ noticeTypeDict.getLabel(detail.noticeType) }}
            </UBadge>
            <span v-if="detail.creator" class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-user" class="size-4" />
              {{ detail.creator }}
            </span>
            <span class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-clock" class="size-4" />
              {{ detailFormatter.format(detailFormatter.fromISO(detail.createdAt)) }}
            </span>
          </div>
          <p class="whitespace-pre-wrap text-sm text-highlighted">
            {{ detail.noticeContent || '暂无内容' }}
          </p>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
