export type LoginPayload = {
  email: string
  password: string
}

export type UserProfile = {
  id: string
  name: string
  email: string
  tier: string
  points: number
  preference: string
}
