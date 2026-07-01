const ANONYMOUS_GUEST_NAME = 'anonymous.guest'
const ANONYMOUS_GUEST_FULL_NAME = 'Anonymous User'
const UNKNOWN_USER_FULL_NAME = 'unknown.user'

export const getActivityUserName = (user: { name?: string; label?: string | null }) => {
  if (!user || !user.name) {
    return UNKNOWN_USER_FULL_NAME
  }
  if (user.name === ANONYMOUS_GUEST_NAME) {
    return ANONYMOUS_GUEST_FULL_NAME
  }
  if (user.label) {
    return user.label
  }
  return user.name
}
