import type { ApiSuccess } from '~~/shared/types/api'
import type { ProductSummary } from '~~/shared/types/product'
import { apiOk } from '../../utils/api-response'
import { createUpstreamClient } from '../../utils/upstream'

export default defineEventHandler(async (event): Promise<ApiSuccess<ProductSummary[]>> => {
  const upstreamFetch = createUpstreamClient(event)
  const data = await upstreamFetch<ProductSummary[]>('/products', {
    query: getQuery(event)
  })

  return apiOk(event, data)
})
