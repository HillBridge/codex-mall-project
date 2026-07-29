<script setup lang="ts">
import { AlertTriangle, RefreshCcw } from 'lucide-vue-next'
import { onErrorCaptured, ref } from 'vue'
import { reportClientError } from '~/utils/client-error'

const hasError = ref(false)

onErrorCaptured((error, _instance, info) => {
  if (!import.meta.client) return

  hasError.value = true
  reportClientError(error, {
    source: 'error-boundary',
    info,
    fatal: false
  })

  return false
})

function reset() {
  hasError.value = false
}

function reload() {
  window.location.reload()
}
</script>

<template>
  <slot v-if="!hasError" />
  <section v-else class="runtime-fallback" role="alert">
    <AlertTriangle :size="28" />
    <div>
      <h1>页面暂时不可用</h1>
      <p>当前模块运行异常，可以重试或刷新页面继续访问。</p>
      <div class="error-actions">
        <button class="button primary" type="button" @click="reset">
          重试
        </button>
        <button class="button ghost" type="button" @click="reload">
          <RefreshCcw :size="18" />
          刷新页面
        </button>
      </div>
    </div>
  </section>
</template>
