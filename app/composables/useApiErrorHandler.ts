import { useAppMessage } from './useAppMessage'
import { createApiErrorView } from '~/utils/api-error'

type HandleApiErrorOptions = {
  fallbackMessage?: string
  notify?: boolean
  redirectOnUnauthorized?: boolean
}

export function useApiErrorHandler() {
  const route = useRoute()
  const { notify } = useAppMessage()

  async function handleApiError(error: unknown, options: HandleApiErrorOptions = {}) {
    const view = createApiErrorView(error, options.fallbackMessage)

    if (options.notify !== false && import.meta.client) {
      notify({
        type: 'error',
        title: view.title,
        description: view.message,
        traceId: view.traceId
      })
    }

    if (options.redirectOnUnauthorized && view.statusCode === 401) {
      await navigateTo({
        path: '/login',
        query: { redirect: route.fullPath }
      })
    }

    return view
  }

  return {
    handleApiError
  }
}
