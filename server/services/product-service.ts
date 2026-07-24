import type { H3Event } from 'h3'
import type { ProductDetail, ProductSummary } from '~~/shared/types/product'
import type { ProductListQuery } from '~~/shared/types/api'
import { products } from '../utils/mock-data'
import { createUpstreamClient } from '../utils/upstream'

export async function listProducts(event: H3Event, filter: ProductListQuery): Promise<ProductSummary[]> {
  const config = useRuntimeConfig(event)

  if (config.apiBaseInternal) {
    const upstreamFetch = createUpstreamClient(event)
    return await upstreamFetch<ProductSummary[]>('/products', { query: filter })
  }

  const q = (filter.q || '').trim().toLowerCase()

  return products
    .filter((product) => {
      if (filter.featured && !product.featured) return false
      if (filter.category && product.category !== filter.category) return false
      if (!q) return true

      return [product.name, product.series, product.category, product.summary]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
    .map(toSummary)
}

export async function getProductBySlug(event: H3Event, slug: string): Promise<ProductDetail | null> {
  const config = useRuntimeConfig(event)

  if (config.apiBaseInternal) {
    const upstreamFetch = createUpstreamClient(event)
    return await upstreamFetch<ProductDetail>(`/products/${slug}`)
  }

  return products.find((item) => item.slug === slug) || null
}

function toSummary(product: ProductDetail): ProductSummary {
  const { description, highlights, stock, ...summary } = product
  return summary
}
