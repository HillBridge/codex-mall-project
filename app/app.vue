<script setup lang="ts">
import AppErrorBoundary from '~/components/ui/AppErrorBoundary.vue'
import AppMessages from '~/components/ui/AppMessages.vue'
</script>

<template>
  <NuxtLoadingIndicator color="#22c55e" />
  <NuxtRouteAnnouncer />
  <AppErrorBoundary>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </AppErrorBoundary>
  <AppMessages />
</template>