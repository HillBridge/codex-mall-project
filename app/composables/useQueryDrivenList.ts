import { computed, ref } from 'vue'
import { serializeApiError } from '~/utils/api-error'
import type { Ref } from 'vue'

type QueryDrivenListState<TItem> = {
  signature: string
  items: TItem[]
}

type QueryDrivenListOptions<TFilter, TItem> = {
  key: string
  filter: Readonly<Ref<TFilter>>
  getSignature?: (filter: TFilter) => string
  fetcher: (filter: TFilter) => Promise<TItem[]>
}

export async function useQueryDrivenList<TFilter, TItem>(
  options: QueryDrivenListOptions<TFilter, TItem>
) {
  const state = useState<QueryDrivenListState<TItem>>(options.key, () => ({
    signature: '',
    items: []
  }))
  const pending = ref(false)
  const error = ref<unknown>(null)
  const signature = computed(() => getSignature(options, options.filter.value))
  let requestId = 0

  async function refresh(nextFilter: TFilter = options.filter.value, showPending = true) {
    requestId += 1
    const currentRequestId = requestId

    if (showPending) {
      pending.value = true
    }
    error.value = null

    try {
      const items = await options.fetcher(nextFilter)

      if (currentRequestId !== requestId) return

      state.value = {
        signature: getSignature(options, nextFilter),
        items
      }
    } catch (fetchError) {
      if (currentRequestId === requestId) {
        error.value = serializeApiError(fetchError)
      }
    } finally {
      if (currentRequestId === requestId) {
        pending.value = false
      }
    }
  }

  if (import.meta.server || state.value.signature !== signature.value) {
    await refresh(options.filter.value, false)
  }

  return {
    data: computed(() => state.value.items),
    pending,
    error,
    refresh
  }
}

function getSignature<TFilter, TItem>(
  options: QueryDrivenListOptions<TFilter, TItem>,
  filter: TFilter
) {
  return options.getSignature ? options.getSignature(filter) : JSON.stringify(filter)
}
