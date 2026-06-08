<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

const appConfig = useAppConfig()

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

useFaviconFromTheme()
</script>

<template>
  <UApp :toaster="appConfig.toaster" :dir="appConfig.movk?.dir">
    <UError :error="error" />
  </UApp>
</template>
