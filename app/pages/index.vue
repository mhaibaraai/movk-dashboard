<script lang="ts" setup>
definePageMeta({
  public: true
})

// 首页非业务路由，登录后落到用户首个可用菜单路由；无可用菜单时回退欢迎页
const { homeRoute } = useNavigation()
if (homeRoute.value) await navigateTo(homeRoute.value, { replace: true })
</script>

<template>
  <AppPanel title="首页">
    <div>home</div>
  </AppPanel>
</template>
