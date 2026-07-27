import type { Ref } from 'vue'
import { useApiClient } from '~/composables/useApiClient'
import { useQueryDrivenList } from '~/composables/useQueryDrivenList'
import type { ProductFilter } from '../types'
import type { ProductSummary } from '~~/shared/types/product'

export async function useProductCatalog(filter: Readonly<Ref<ProductFilter>>) {
  const apiFetch = useApiClient()

  return await useQueryDrivenList<ProductFilter, ProductSummary>({
    key: 'products:catalog',
    filter,
    getSignature: createCatalogSignature,
    fetcher: async (nextFilter) => {
      const result = await apiFetch('/products', {
        query: {
          q: nextFilter.q || undefined,
          category: nextFilter.category || undefined
        }
      })

      return result as ProductSummary[]
    }
  })
}

function createCatalogSignature(filter: ProductFilter) {
  return JSON.stringify({
    q: filter.q || '',
    category: filter.category || ''
  })
}
