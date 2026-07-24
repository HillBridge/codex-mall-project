import type { ProductDetail, ProductSummary } from './product'
import type { UserProfile } from './user'

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL_ERROR'

export type ApiSuccess<T> = {
  data: T
  traceId: string
}

export type ApiFailure = {
  code: ApiErrorCode
  message: string
  traceId?: string
  details?: unknown
}

export type ApiClientError = Error & {
  statusCode: number
  code: ApiErrorCode
  traceId?: string
  details?: unknown
}

export type ApiRouteMap = {
  '/products': ProductSummary[]
  '/auth/me': UserProfile
  '/auth/login': { user: UserProfile }
  '/auth/logout': { ok: true }
}

export type ApiPath = keyof ApiRouteMap | `/products/${string}`

export type ApiResponseFor<TPath extends string> =
  TPath extends keyof ApiRouteMap
    ? ApiRouteMap[TPath]
    : TPath extends `/products/${string}`
      ? ProductDetail
      : unknown

export type ProductListQuery = {
  q?: string
  category?: string
  featured?: boolean
}
