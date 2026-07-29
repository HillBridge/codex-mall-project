import { isRef, toValue } from 'vue'
import { useApiClient } from './useApiClient'
import { serializeApiError } from '~/utils/api-error'

function readQuery(query) {
  if (!query) return undefined
  return isRef(query) ? query.value : query
}

export function useApiData(path, options = {}) {
  const apiFetch = useApiClient()
  const asyncOptions = {
    default: options?.default
  }

  if (options?.watch !== false) {
    asyncOptions.watch = options?.watch
  }

  return useAsyncData(
    options?.key || `api:${toValue(path)}`,
    async () => {
      try {
        return await apiFetch(toValue(path), {
          query: readQuery(options?.query)
        })
      } catch (error) {
        throw serializeApiError(error)
      }
    },
    asyncOptions
  )
}
