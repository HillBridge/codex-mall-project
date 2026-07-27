<script setup lang="ts">
import { ArrowRight, ShieldCheck, Sparkles, TimerReset } from 'lucide-vue-next'
import { computed } from 'vue'
import { useApiData } from '~/composables/useApiData'
import { usePageSeo } from '~/composables/usePageSeo'
import ProductCard from '~/features/products/components/ProductCard.vue'
import type { ProductSummary } from '~~/shared/types/product'

usePageSeo({
  title: '首页',
  description: 'Nuxt 中大型 C 端项目试水样板，覆盖 SSR、BFF、路由缓存、鉴权和模块化实践。'
})

const { data: products, pending, error, refresh } = await useApiData('/products', {
  query: { featured: true },
  key: 'home-featured-products',
  default: () => []
})
const featuredProducts = computed(() => (products.value || []) as ProductSummary[])
</script>

<template>
  <div>
    <section class="home-hero">
      <div class="hero-copy">
        <p class="eyebrow">Nuxt Real Pilot</p>
        <h1>把后台项目当成中大型 C 端项目来练。</h1>
        <p>
          这套骨架把 Nuxt 的复杂点前置处理：服务端渲染、BFF 接口、Cookie 鉴权、
          路由级缓存、SEO、状态同步和特性模块拆分都已经在代码里跑通。
        </p>
        <div class="hero-actions">
          <NuxtLink class="button primary" to="/products">
            看商品流
            <ArrowRight :size="18" />
          </NuxtLink>
          <NuxtLink class="button ghost" to="/account/profile">体验鉴权页</NuxtLink>
        </div>
      </div>
      <div class="hero-panel" aria-label="核心能力概览">
        <div class="signal-strip">
          <span>SSR</span>
          <span>BFF</span>
          <span>Cache</span>
          <span>SEO</span>
        </div>
        <div class="metric-grid">
          <div>
            <strong>120s</strong>
            <span>商品列表 SWR</span>
          </div>
          <div>
            <strong>300s</strong>
            <span>详情页 SWR</span>
          </div>
          <div>
            <strong>Cookie</strong>
            <span>服务端鉴权</span>
          </div>
          <div>
            <strong>Typed</strong>
            <span>共享类型</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section-band">
      <div class="section-heading">
        <p class="eyebrow">Featured</p>
        <h2>服务端首屏商品</h2>
      </div>
      <PendingBlock v-if="pending" />
      <section v-else-if="error" class="inline-error">
        <p>推荐商品加载失败。</p>
        <button class="button primary" type="button" @click="refresh()">重新加载</button>
      </section>
      <div v-else class="product-grid">
        <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
      </div>
    </section>

    <section class="practice-grid">
      <div class="practice-item">
        <ShieldCheck :size="28" />
        <h2>鉴权边界</h2>
        <p>页面中间件、服务端 Cookie 和 Pinia 会话状态保持同一套语义。</p>
      </div>
      <div class="practice-item">
        <TimerReset :size="28" />
        <h2>缓存边界</h2>
        <p>页面缓存用 routeRules 管，接口默认 no-store，避免数据新鲜度混乱。</p>
      </div>
      <div class="practice-item">
        <Sparkles :size="28" />
        <h2>模块边界</h2>
        <p>按业务特性组织组件、组合函数和类型，避免页面目录膨胀成杂物间。</p>
      </div>
    </section>
  </div>
</template>
