<script setup lang="ts">
const { getSectionLinks } = useNavigation()
</script>

<template>
  <AppPanel id="monitor" title="系统监控">
    <template #toolbar>
      <UNavigationMenu :items="getSectionLinks('/monitor')" highlight class="-mx-1 flex-1" />
    </template>

    <NuxtPage />
  </AppPanel>
</template>
