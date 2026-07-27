import { useNuxtApp } from '#app/nuxt'

export function useApiClient() {
  return useNuxtApp().$api
}
