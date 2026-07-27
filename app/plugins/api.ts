import { createApiClient } from '~/utils/api-client'
import type { ApiClientFetcher } from '~/utils/api-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const forwardedHeaders = import.meta.server
    ? useRequestHeaders(['cookie', 'x-request-id'])
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
