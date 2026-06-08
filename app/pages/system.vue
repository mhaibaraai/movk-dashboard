<script setup lang="ts">
const { systemLinks } = useNavigation()
</script>

<template>
  <AppPanel id="system" title="系统管理">
    <template #toolbar>
      <UNavigationMenu :items="systemLinks" highlight class="-mx-1 flex-1" />
    </template>

    <NuxtPage />
  </AppPanel>
</template>
