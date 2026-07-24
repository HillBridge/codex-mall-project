import { defineStore } from 'pinia'
import type { LoginPayload, UserProfile } from '~~/shared/types/user'

export const useSessionStore = defineStore('session', () => {
  const loggedInHint = useCookie('nuxt_pilot_logged_in')
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
      loggedInHint.value = null
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
      loggedInHint.value = '1'
      ready.value = true
    } finally {
      pending.value = false
    }
  }

  async function logout() {
    const apiFetch = useApiClient()
    await apiFetch('/auth/logout', { method: 'POST' })
    user.value = null
    loggedInHint.value = null
    ready.value = true
    await navigateTo('/')
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
