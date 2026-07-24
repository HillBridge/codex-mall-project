import type { ApiSuccess } from '~~/shared/types/api'
import type { ProductDetail } from '~~/shared/types/product'
import { apiOk, throwApiError } from '../../utils/api-response'
import { getProductBySlug } from '../../services/product-service'

export default defineEventHandler(async (event): Promise<ApiSuccess<ProductDetail>> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throwApiError(event, {
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: '缺少商品标识'
    })
  }

  const product: ProductDetail | null = await getProductBySlug(event, slug)

  if (!product) {
    throwApiError(event, {
      statusCode: 404,
      code: 'NOT_FOUND',
      message: '商品不存在'
    })
  }

  return apiOk(event, product)
})
