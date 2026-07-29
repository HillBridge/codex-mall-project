<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import EmptyState from '~/components/ui/EmptyState.vue'
import PendingBlock from '~/components/ui/PendingBlock.vue'
import { usePageSeo } from '~/composables/usePageSeo'
import ProductCard from '~/features/products/components/ProductCard.vue'
import { useProductCatalog } from '~/features/products/composables/useProductCatalog'
import { createApiErrorView, formatTraceId } from '~/utils/api-error'
import type { ProductFilter } from '~/features/products/types'
import type { ProductSummary } from '~~/shared/types/product'

usePageSeo({
  title: '商品',
  description: 'SSR 商品列表页，演示 Nuxt 数据获取、查询参数同步和模块化组件组织。'
})

const route = useRoute()
const router = useRouter()
const filter = computed<ProductFilter>(() => ({
  q: readQueryValue(route.query.q),
  category: readQueryValue(route.query.category)
}))
const qDraft = ref(filter.value.q || '')

const { data: products, pending, error, refresh } = await useProductCatalog(filter)
const productList = computed(() => (products.value || []) as ProductSummary[])
const requestTraceId = import.meta.server ? String(useRequestEvent()?.context.requestId || '') : ''
const errorView = computed(() => {
  console.log('error', error.value)
  if (!error.value) return null
  const view = createApiErrorView(error.value, '商品数据加载失败，请稍后重试。')
  return view.traceId || !requestTraceId ? view : { ...view, traceId: requestTraceId }
})

const categories = ['全部', '家居', '户外', '数码', '穿搭']

function readQueryValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

async function replaceProductQuery(next: ProductFilter) {
  await router.replace({
    query: {
      q: next.q || undefined,
      category: next.category || undefined
    }
  })
}

watch(
  () => filter.value.q,
  (value) => {
    if (qDraft.value !== (value || '')) {
      qDraft.value = value || ''
    }
  }
)

onMounted(() => {
  watchDebounced(
    qDraft,
    async (value: string) => {
      const nextQ = value || ''
      if (nextQ === (filter.value.q || '')) return

      const nextFilter = {
        q: nextQ,
        category: filter.value.category
      }

      await replaceProductQuery(nextFilter)
      await refresh(nextFilter)
    },
    {
      debounce: 250,
      maxWait: 1000
    }
  )
})

async function selectCategory(category: string) {
  const nextFilter = {
    q: qDraft.value,
    category: category === '全部' ? '' : category
  }

  await replaceProductQuery(nextFilter)
  await refresh(nextFilter)
}
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
        <input v-model.trim="qDraft" type="search" placeholder="搜索商品、系列或卖点">
      </label>
      <div class="segment-control">
        <button v-for="category in categories" :key="category" class="segment"
          :class="{ active: (filter.category || '全部') === category }" type="button" @click="selectCategory(category)">
          {{ category }}
        </button>
      </div>
    </section>

    <PendingBlock v-if="pending && !productList.length" />
    <section v-else-if="errorView" class="inline-error">
      <h2>{{ errorView.title }}</h2>
      <p>{{ errorView.message }}</p>
      <small v-if="errorView.traceId">{{ formatTraceId(errorView.traceId) }}</small>
      <button class="button primary" type="button" @click="refresh()">重新加载</button>
    </section>
    <EmptyState v-else-if="!productList.length" title="没有匹配商品" description="换一个关键词或分类继续找找。" />
    <section v-else class="product-grid page-grid">
      <ProductCard v-for="product in productList" :key="product.id" :product="product" />
    </section>
  </div>
</template>
