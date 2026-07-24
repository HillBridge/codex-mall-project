<script setup lang="ts">
import { SearchX } from 'lucide-vue-next'

defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="empty-state">
    <SearchX :size="34" />
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </section>
</template>
