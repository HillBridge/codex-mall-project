<script setup lang="ts">
import { LogOut, Menu, Search, User, X } from 'lucide-vue-next'

const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()
const productConfig = appConfig.product as { name?: string } | undefined
const navItems = appConfig.navigation as Array<{ label: string, to: string }> | undefined
const session = useSessionStore()
const route = useRoute()
const menuOpen = ref(false)
const loggedInHint = useLoggedInHintCookie()

const productName = computed(() => productConfig?.name || runtimeConfig.public.appName)
const navigation = computed(() => navItems || [
  { label: '首页', to: '/' },
  { label: '商品', to: '/products' },
  { label: '账户', to: '/account/profile' }
])

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  }
)

onMounted(() => {
  if (!session.ready && loggedInHint.value === '1') {
    void session.fetchCurrentUser()
  }
})
</script>

<template>
  <header class="site-header">
    <NuxtLink class="brand" to="/" aria-label="Nuxt Pilot 首页">
      <span class="brand-mark">N</span>
      <span>{{ productName }}</span>
    </NuxtLink>

    <nav class="desktop-nav" aria-label="主导航">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        active-class="active"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="header-actions">
      <NuxtLink class="icon-button" to="/products" aria-label="搜索商品" title="搜索商品">
        <Search :size="19" />
      </NuxtLink>
      <NuxtLink class="icon-button" to="/account/profile" aria-label="账户" title="账户">
        <User :size="19" />
      </NuxtLink>
      <button
        v-if="session.user"
        class="icon-button"
        type="button"
        aria-label="退出登录"
        title="退出登录"
        @click="session.logout()"
      >
        <LogOut :size="19" />
      </button>
      <button class="icon-button mobile-menu" type="button" aria-label="打开菜单" @click="menuOpen = !menuOpen">
        <X v-if="menuOpen" :size="20" />
        <Menu v-else :size="20" />
      </button>
    </div>

    <nav v-if="menuOpen" class="mobile-nav" aria-label="移动端主导航">
      <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" class="mobile-nav-link">
        {{ item.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
