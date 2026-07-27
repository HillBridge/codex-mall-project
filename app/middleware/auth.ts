import { useSessionStore } from '~/stores/session'

export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSessionStore()

  if (!session.ready) {
    await session.fetchCurrentUser()
  }

  if (!session.user) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
