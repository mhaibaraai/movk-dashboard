<script setup lang="ts">
const { monitorLinks } = useNavigation()
</script>

<template>
  <AppPanel id="monitor" title="系统监控">
    <template #toolbar>
      <UNavigationMenu :items="monitorLinks" highlight class="-mx-1 flex-1" />
    </template>

    <NuxtPage />
  </AppPanel>
</template>
