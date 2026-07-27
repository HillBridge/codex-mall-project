<script setup lang="ts">
import { createError } from '#app/composables/error'
import { useRoute } from '#app/composables/router'
import { ArrowLeft, ShoppingBag } from 'lucide-vue-next'
import { computed } from 'vue'
import { useApiData } from '~/composables/useApiData'
import { usePageSeo } from '~/composables/usePageSeo'
import type { ProductDetail } from '~~/shared/types/product'

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : String(route.params.slug)
const { data: product } = await useApiData(`/products/${slug}` as `/products/${string}`, {
  key: `product:${slug}`
})
const currentProduct = computed(() => product.value as ProductDetail | null)

if (!currentProduct.value) {
  throw createError({
    statusCode: 404,
    message: '商品不存在'
  })
}

usePageSeo({
  title: currentProduct.value.name,
  description: currentProduct.value.summary,
  image: currentProduct.value.image
})
</script>

<template>
  <article v-if="currentProduct" class="product-detail">
    <NuxtLink class="back-link" to="/products">
      <ArrowLeft :size="18" />
      返回商品
    </NuxtLink>

    <div class="detail-layout">
      <div class="detail-media">
        <img :src="currentProduct.image" :alt="currentProduct.name">
      </div>
      <section class="detail-copy">
        <p class="eyebrow">{{ currentProduct.category }} / {{ currentProduct.series }}</p>
        <h1>{{ currentProduct.name }}</h1>
        <p>{{ currentProduct.description }}</p>
        <div class="detail-price">
          <strong>¥{{ currentProduct.price.toLocaleString('zh-CN') }}</strong>
          <span>库存 {{ currentProduct.stock }} 件</span>
        </div>
        <button class="button primary" type="button">
          <ShoppingBag :size="18" />
          加入购物袋
        </button>
      </section>
    </div>

    <section class="section-band detail-section">
      <div class="section-heading">
        <p class="eyebrow">Highlights</p>
        <h2>核心卖点</h2>
      </div>
      <ul class="highlight-list">
        <li v-for="highlight in currentProduct.highlights" :key="highlight">{{ highlight }}</li>
      </ul>
    </section>
  </article>
</template>
