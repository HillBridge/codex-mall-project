<script setup lang="ts">
import { ArrowRight, Heart, ShoppingBag } from 'lucide-vue-next'
import type { ProductSummary } from '~~/shared/types/product'

defineProps<{
  product: ProductSummary
}>()
</script>

<template>
  <article class="product-card">
    <NuxtLink class="product-media" :to="`/products/${product.slug}`" :aria-label="`查看 ${product.name}`">
      <img :src="product.image" :alt="product.name" loading="lazy">
      <span class="product-badge">{{ product.category }}</span>
    </NuxtLink>
    <div class="product-content">
      <div>
        <p class="product-kicker">{{ product.series }}</p>
        <h2>{{ product.name }}</h2>
        <p>{{ product.summary }}</p>
      </div>
      <div class="product-meta">
        <strong>¥{{ product.price.toLocaleString('zh-CN') }}</strong>
        <div class="product-actions">
          <button class="icon-button subtle" type="button" aria-label="收藏" title="收藏">
            <Heart :size="18" />
          </button>
          <button class="icon-button subtle" type="button" aria-label="加入购物袋" title="加入购物袋">
            <ShoppingBag :size="18" />
          </button>
          <NuxtLink class="icon-button dark" :to="`/products/${product.slug}`" aria-label="查看详情" title="查看详情">
            <ArrowRight :size="18" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </article>
</template>
