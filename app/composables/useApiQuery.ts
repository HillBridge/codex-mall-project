import { isRef, toValue } from 'vue'
import type { MaybeRefOrGetter, MultiWatchSources } from 'vue'
import { useApiClient } from './useApiClient'
import { serializeApiError } from '~/utils/api-error'
import type { ApiResponseFor } from '~~/shared/types/api'

type ApiQueryOptions<TPath extends string> = {
  key?: string
  query?: MaybeRefOrGetter<Record<string, unknown> | undefined>
  default?: () => ApiResponseFor<TPath>
  watch?: MultiWatchSources | false
}

function readQuery(query?: ApiQueryOptions<string>['query']) {
  if (!query) return undefined
  return isRef(query) ? query.value : toValue(query)
}

export function useApiQuery<TPath extends string>(
  path: MaybeRefOrGetter<TPath>,
  options: ApiQueryOptions<TPath> = {}
) {
  const apiFetch = useApiClient()
  const asyncOptions: {
    default?: () => ApiResponseFor<TPath>
    watch?: MultiWatchSources
  } = {
    default: options.default
  }

  if (options.watch !== false) {
    asyncOptions.watch = options.watch
  }

  return useAsyncData(
    options.key || `api:${toValue(path)}`,
    async () => {
      try {
        return await apiFetch(toValue(path), {
          query: readQuery(options.query)
        })
      } catch (error) {
        throw serializeApiError(error)
      }
    },
    asyncOptions
  )
}
