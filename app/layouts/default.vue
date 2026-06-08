<script lang="ts" setup>
const route = useRoute()

const open = ref(false)

const { navigation } = useNavigation()

watch(() => route.path, () => {
  open.value = false
})

const groups = computed(() => [{
  id: 'links',
  label: '前往',
  items: navigation.flat()
}, {
  id: 'code',
  label: '代码',
  items: [{
    id: 'source',
    label: '查看页面源码',
    icon: 'i-simple-icons-github',
    to: `https://github.com/mhaibaraai/movk-nuxt-dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <Logo v-if="!collapsed" class="h-5 w-auto shrink-0" />
        <UIcon v-else name="i-simple-icons-nuxtdotjs" class="size-5 text-primary mx-auto" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu :collapsed="collapsed" :items="navigation[0]" orientation="vertical" tooltip popover />

        <UNavigationMenu :collapsed="collapsed" :items="navigation[1]" orientation="vertical" tooltip class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
