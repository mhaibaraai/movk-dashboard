<script lang="ts" setup>
definePageMeta({
  access: 'authed'
})
</script>

<template>
  <AppPanel title="工作台">
    <div class="flex flex-col gap-3 min-h-0 flex-1 overflow-y-auto p-px">
      <HomeWelcome class="shrink-0" />
      <HomeStats class="shrink-0" />

      <div class="grid gap-3 lg:grid-cols-2 shrink-0">
        <HomeRecentLogins />
        <HomeRecentOperations />
      </div>

      <HomeNotices class="shrink-0" />
    </div>
  </AppPanel>
</template>
