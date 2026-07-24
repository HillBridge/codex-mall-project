import type { ProductFilter } from '../types'
import type { ProductSummary } from '~~/shared/types/product'

type ProductCatalogState = {
  signature: string
  items: ProductSummary[]
}

export async function useProductCatalog(filter: Readonly<Ref<ProductFilter>>) {
  const apiFetch = useApiClient()
  const catalog = useState<ProductCatalogState>('products:catalog', () => ({
    signature: '',
    items: []
  }))
  const pending = ref(false)
  const error = ref<unknown>(null)
  const signature = computed(() => createCatalogSignature(filter.value))
  let requestId = 0

  async function fetchCatalog(nextFilter: ProductFilter, showPending: boolean) {
    requestId += 1
    const currentRequestId = requestId

    if (showPending) {
      pending.value = true
    }
    error.value = null

    try {
      const result = await apiFetch('/products', {
        query: {
          q: nextFilter.q || undefined,
          category: nextFilter.category || undefined
        }
      })

      if (currentRequestId !== requestId) return

      catalog.value = {
        signature: createCatalogSignature(nextFilter),
        items: result as ProductSummary[]
      }
    } catch (fetchError) {
      if (currentRequestId === requestId) {
        error.value = fetchError
      }
    } finally {
      if (currentRequestId === requestId) {
        pending.value = false
      }
    }
  }

  if (import.meta.server || catalog.value.signature !== signature.value) {
    await fetchCatalog(filter.value, false)
  }

  return {
    data: computed(() => catalog.value.items),
    pending,
    error,
    refresh: (nextFilter: ProductFilter = filter.value) => fetchCatalog(nextFilter, true)
  }
}

function createCatalogSignature(filter: ProductFilter) {
  return JSON.stringify({
    q: filter.q || '',
    category: filter.category || ''
  })
}
