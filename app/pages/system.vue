<script setup lang="ts">
const { getSectionLinks } = useNavigation()
</script>

<template>
  <AppPanel id="system" title="系统管理">
    <template #toolbar>
      <UNavigationMenu :items="getSectionLinks('/system')" highlight class="-mx-1 flex-1" />
    </template>

    <NuxtPage />
  </AppPanel>
</template>
