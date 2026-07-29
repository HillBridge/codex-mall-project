<script setup lang="ts">
import AppFooter from '~/components/app/AppFooter.vue'
import AppHeader from '~/components/app/AppHeader.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
