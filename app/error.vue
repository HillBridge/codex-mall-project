<script setup lang="ts">
import { ArrowLeft, RefreshCcw } from 'lucide-vue-next'
import { computed } from 'vue'
import { formatTraceId } from '~/utils/api-error'

const props = defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
    data?: {
      traceId?: string
    }
  }
}>()

const statusCode = computed(() => props.error.statusCode ?? 500)
const title = computed(() => {
  if (statusCode.value === 404) return '页面没有找到'
  return '页面暂时不可用'
})

const goHome = () => clearError({ redirect: '/' })
const retry = () => {
  window.location.reload()
}
const traceId = computed(() => props.error.data?.traceId)
</script>

<template>
  <main class="error-page">
    <p class="eyebrow">{{ statusCode }}</p>
    <h1>{{ title }}</h1>
    <p>{{ error.statusMessage || error.message || '请稍后再试，或者回到首页继续浏览。' }}</p>
    <small v-if="traceId">{{ formatTraceId(traceId) }}</small>
    <div class="error-actions">
      <button
        class="button primary"
        type="button"
        @click="goHome"
      >
        <ArrowLeft :size="18" />
        返回首页
      </button>
      <button
        class="button ghost"
        type="button"
        @click="retry"
      >
        <RefreshCcw :size="18" />
        重试
      </button>
    </div>
  </main>
</template>
