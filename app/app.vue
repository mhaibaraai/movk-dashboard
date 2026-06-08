<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale'

const appConfig = useAppConfig()

const { color, style, link } = useTheme()

useHead({
  title: 'Movk Dashboard',
  meta: [{ key: 'theme-color', name: 'theme-color', content: color }],
  link,
  style
})

useFaviconFromTheme()
</script>

<template>
  <UApp :locale="zh_cn" :toaster="appConfig.toaster" :dir="appConfig.movk?.dir">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
