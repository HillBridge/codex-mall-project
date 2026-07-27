export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSessionStore()

  if (!session.ready) {
    console.log('fetchCurrentUser---middleware')
    await session.fetchCurrentUser()
  }

  if (!session.user) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
