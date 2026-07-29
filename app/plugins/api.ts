import { createApiClient } from '~/utils/api-client'
import type { ApiClientFetcher } from '~/utils/api-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const requestEvent = import.meta.server ? useRequestEvent() : undefined
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie', 'x-request-id']) : undefined
  const forwardedHeaders = import.meta.server
    ? {
        ...requestHeaders,
        'x-request-id': String(requestEvent?.context.requestId || requestHeaders?.['x-request-id'] || '')
      }
    : undefined
  const fetcher = import.meta.server ? useRequestFetch() as ApiClientFetcher : undefined

  return {
    provide: {
      api: createApiClient({
        baseURL: config.public.apiBase,
        forwardedHeaders,
        fetcher
      })
    }
  }
})
