import { z } from 'zod'
import type { ApiSuccess } from '~~/shared/types/api'
import type { ProductSummary } from '~~/shared/types/product'
import { apiOk, throwApiError } from '../../utils/api-response'
import { listProducts } from '../../services/product-service'

const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  featured: z.preprocess((value) => {
    if (value === true || value === 'true') return true
    if (value === false || value === 'false' || value === '' || value == null) return false
    return value
  }, z.boolean()).optional()
})

export default defineEventHandler(async (event): Promise<ApiSuccess<ProductSummary[]>> => {
  const parsed = productQuerySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throwApiError(event, {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: '商品筛选参数不合法',
      details: parsed.error.flatten()
    })
  }

  const data: ProductSummary[] = await listProducts(event, {
    q: parsed.data.q,
    category: parsed.data.category,
    featured: parsed.data.featured
  })

  return apiOk(event, data)
})
