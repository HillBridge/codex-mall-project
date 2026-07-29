<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { useAppMessage } from '~/composables/useAppMessage'

const { messages, dismiss } = useAppMessage()

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: ShieldAlert,
  error: AlertCircle
}

const visibleMessages = computed(() => messages.value)
</script>

<template>
  <Teleport to="body">
    <div v-if="visibleMessages.length" class="app-messages" aria-live="polite" aria-atomic="false">
      <section
        v-for="message in visibleMessages"
        :key="message.id"
        class="app-message"
        :class="`app-message-${message.type}`"
      >
        <component :is="icons[message.type]" :size="20" />
        <div>
          <strong>{{ message.title }}</strong>
          <p v-if="message.description">{{ message.description }}</p>
          <small v-if="message.traceId">错误编号：{{ message.traceId }}</small>
        </div>
        <button type="button" aria-label="关闭提示" @click="dismiss(message.id)">
          <X :size="16" />
        </button>
      </section>
    </div>
  </Teleport>
</template>
