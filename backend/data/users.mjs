export const demoUser = {
  id: 'user_demo_001',
  name: 'Nuxt Pilot',
  email: 'demo@example.com',
  password: 'nuxt-demo',
  tier: 'Pro',
  points: 12880,
  preference: '低延迟购物体验'
}

export function toUserProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    tier: user.tier,
    points: user.points,
    preference: user.preference
  }
}
