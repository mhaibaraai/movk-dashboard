<script setup lang="ts">
import type {
  DashboardNavbarSlots,
  DashboardPanelSlots,
  DashboardToolbarSlots
} from '@nuxt/ui'

defineProps<{
  id?: string
  title?: string
  icon?: string
}>()

defineSlots<{
  default: NonNullable<DashboardPanelSlots['body']>
  title: NonNullable<DashboardNavbarSlots['title']>
  toolbar: NonNullable<DashboardToolbarSlots['default']>
  actions: NonNullable<DashboardNavbarSlots['right']>
}>()
</script>

<template>
  <UDashboardPanel :id="id">
    <template #header>
      <UDashboardNavbar :title="title" :icon="icon">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template v-if="$slots.title" #title>
          <slot name="title" />
        </template>

        <template v-if="$slots.actions" #right="props">
          <slot name="actions" v-bind="props" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="$slots.toolbar">
        <slot name="toolbar" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>
