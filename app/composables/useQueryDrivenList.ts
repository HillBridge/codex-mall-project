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
  // ===== init 仅在该 key 下值为 undefined 时执行,客户端水合时 payload 里已有值,就不会再执行
  const state = useState<QueryDrivenListState<TItem>>(options.key, () => ({
    // ===== useState中key共享同一份状态
    // ===== 这个key是同步服务端和客户端渲染的唯一标识, 不统一会造成水合时的数据不一致
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
      // ===== 处理新旧api竞态情况, 新请求快于旧请求时, 废弃掉旧请求返回的结果
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
