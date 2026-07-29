<script setup lang="ts">
import AppMessages from '~/components/ui/AppMessages.vue'
</script>

<template>
  <NuxtLoadingIndicator color="#22c55e" />
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppMessages />
</template>
