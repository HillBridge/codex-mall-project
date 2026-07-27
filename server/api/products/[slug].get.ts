import { defineEventHandler, getRouterParam } from 'h3'
import type { ApiSuccess } from '~~/shared/types/api'
import type { ProductDetail } from '~~/shared/types/product'
import { apiOk, throwApiError } from '../../utils/api-response'
import { createUpstreamClient } from '../../utils/upstream'

export default defineEventHandler(async (event): Promise<ApiSuccess<ProductDetail>> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throwApiError(event, {
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: '缺少商品标识'
    })
  }

  const upstreamFetch = createUpstreamClient(event)
  const product = await upstreamFetch<ProductDetail>(`/products/${slug}`)

  return apiOk(event, product)
})
