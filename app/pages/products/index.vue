<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import type { ProductFilter } from '~/features/products/types'
import type { ProductSummary } from '~~/shared/types/product'

usePageSeo({
  title: '商品',
  description: 'SSR 商品列表页，演示 Nuxt 数据获取、查询参数同步和模块化组件组织。'
})

const route = useRoute()
const router = useRouter()
const filter = ref<ProductFilter>({
  q: typeof route.query.q === 'string' ? route.query.q : '',
  category: typeof route.query.category === 'string' ? route.query.category : ''
})

const { data: products, pending, error, refresh } = await useProductCatalog(filter)
const productList = computed(() => (products.value || []) as ProductSummary[])

const categories = ['全部', '家居', '户外', '数码', '穿搭']

watch(
  filter,
  (value) => {
    router.replace({
      query: {
        q: value.q || undefined,
        category: value.category || undefined
      }
    })
  },
  { deep: true }
)
</script>

<template>
  <div>
    <section class="page-heading compact">
      <p class="eyebrow">Catalog</p>
      <h1>商品流</h1>
      <p>这里用同一份接口同时服务 SSR 首屏和客户端筛选，模拟 C 端列表的真实数据链路。</p>
    </section>

    <section class="filter-bar" aria-label="商品筛选">
      <label class="search-box">
        <Search :size="18" />
        <input v-model.trim="filter.q" type="search" placeholder="搜索商品、系列或卖点">
      </label>
      <div class="segment-control">
        <button
          v-for="category in categories"
          :key="category"
          class="segment"
          :class="{ active: (filter.category || '全部') === category }"
          type="button"
          @click="filter.category = category === '全部' ? '' : category"
        >
          {{ category }}
        </button>
      </div>
    </section>

    <PendingBlock v-if="pending" />
    <section v-else-if="error" class="inline-error">
      <p>商品数据加载失败。</p>
      <button class="button primary" type="button" @click="refresh()">重新加载</button>
    </section>
    <EmptyState
      v-else-if="!productList.length"
      title="没有匹配商品"
      description="换一个关键词或分类继续找找。"
    />
    <section v-else class="product-grid page-grid">
      <ProductCard v-for="product in productList" :key="product.id" :product="product" />
    </section>
  </div>
</template>
