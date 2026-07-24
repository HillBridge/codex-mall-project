import type { ProductFilter } from '../types'
import type { ProductSummary } from '~~/shared/types/product'

export async function useProductCatalog(filter: Ref<ProductFilter>) {
  const apiFetch = useApiClient()
  const query = computed(() => ({
    q: filter.value.q || undefined,
    category: filter.value.category || undefined
  }))

  const catalog = await useApiData('/products', {
    query,
    key: `products:catalog:${filter.value.q || 'all'}:${filter.value.category || 'all'}`,
    watch: false,
    default: () => []
  })
  const searchPending = ref(false)
  const searchError = ref<unknown>(null)
  let requestId = 0
  let abortController: AbortController | null = null

  async function refreshCatalog() {
    requestId += 1
    const currentRequestId = requestId

    abortController?.abort()
    abortController = new AbortController()
    searchPending.value = true
    searchError.value = null

    try {
      const result = await apiFetch('/products', {
        query: query.value,
        signal: abortController.signal
      })

      if (currentRequestId === requestId) {
        catalog.data.value = result as ProductSummary[]
      }
    } catch (error) {
      if (!abortController.signal.aborted && currentRequestId === requestId) {
        searchError.value = error
      }
    } finally {
      if (currentRequestId === requestId) {
        searchPending.value = false
      }
    }
  }

  if (import.meta.client) {
    watchDebounced(
      [() => filter.value.q, () => filter.value.category],
      () => {
        void refreshCatalog()
      },
      {
        debounce: 250,
        maxWait: 1000
      }
    )
  }

  return {
    ...catalog,
    pending: computed(() => catalog.pending.value || searchPending.value),
    error: computed(() => catalog.error.value || searchError.value),
    refresh: refreshCatalog
  }
}
