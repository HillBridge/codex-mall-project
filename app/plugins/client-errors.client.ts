import { useAppMessage } from '~/composables/useAppMessage'
import { isChunkLoadError, reportClientError } from '~/utils/client-error'

export default defineNuxtPlugin((nuxtApp) => {
  const { notify } = useAppMessage()
  let chunkErrorNotified = false
  let runtimeErrorNotified = false

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    reportClientError(error, {
      source: 'vue:error',
      info,
      fatal: false
    })
    notifyRuntimeError()
  })

  nuxtApp.hook('app:error', (error) => {
    reportClientError(error, {
      source: 'app:error',
      fatal: true
    })
    notifyRuntimeError()
  })

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    handleChunkLoadError((event as Event & { payload?: unknown }).payload || event)
  })

  window.addEventListener('error', (event) => {
    const error = event.error || event.message

    if (isChunkLoadError(error)) {
      handleChunkLoadError(error)
      return
    }

    reportClientError(error, {
      source: 'window:error',
      fatal: false
    })
    notifyRuntimeError()
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) {
      event.preventDefault()
      handleChunkLoadError(event.reason)
      return
    }

    reportClientError(event.reason, {
      source: 'unhandledrejection',
      fatal: false
    })
    notifyRuntimeError()
  })

  function handleChunkLoadError(error: unknown) {
    reportClientError(error, {
      source: 'vite:preloadError',
      fatal: true
    })

    if (chunkErrorNotified) return

    chunkErrorNotified = true
    notify({
      type: 'warning',
      title: '页面资源已更新',
      description: '当前页面加载的资源版本可能已经过期，刷新后即可继续使用。',
      action: {
        label: '刷新页面',
        kind: 'reload'
      },
      duration: 0
    })
  }

  function notifyRuntimeError() {
    if (runtimeErrorNotified) return

    runtimeErrorNotified = true
    notify({
      type: 'error',
      title: '页面运行异常',
      description: '当前页面遇到异常，部分功能可能不可用。你可以刷新页面后再试。',
      action: {
        label: '刷新页面',
        kind: 'reload'
      },
      duration: 0
    })
  }
})
