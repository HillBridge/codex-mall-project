import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useApiClient } from '~/composables/useApiClient'
import type { LoginPayload, UserProfile } from '~~/shared/types/user'

export const useSessionStore = defineStore('session', () => {
  const user = ref<UserProfile | null>(null)
  const pending = ref(false)
  const ready = ref(false)

  const isLoggedIn = computed(() => Boolean(user.value))

  async function fetchCurrentUser() {
    if (pending.value) return

    pending.value = true
    try {
      const apiFetch = useApiClient()
      user.value = await apiFetch('/auth/me')
    } catch {
      user.value = null
    } finally {
      ready.value = true
      pending.value = false
    }
  }

  async function login(payload: LoginPayload) {
    pending.value = true
    try {
      const apiFetch = useApiClient()
      const result = await apiFetch('/auth/login', {
        method: 'POST',
        body: payload
      })

      user.value = result.user
      ready.value = true
    } finally {
      pending.value = false
    }
  }

  async function logout() {
    const apiFetch = useApiClient()
    await apiFetch('/auth/logout', { method: 'POST' })
    user.value = null
    ready.value = true
    // ====== 退出后整页刷新: 一次性丢弃 Pinia / useState / useAsyncData 等全部客户端缓存, 避免上一个用户的数据残留
    await navigateTo('/', { external: true, replace: true })
  }

  return {
    user,
    pending,
    ready,
    isLoggedIn,
    fetchCurrentUser,
    login,
    logout
  }
})
