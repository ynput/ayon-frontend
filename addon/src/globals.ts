// Things that are the same in every slot. They are imports, never part of a slot's context.
import { getHost } from './hostBridge'
import type { AddonUser } from './hostBridge'

const noUser = (): AddonUser | undefined => undefined

/** The signed-in user. `undefined` only while AYON is still signing in. */
export const useUser = (): AddonUser | undefined => {
  // the host registers its implementation once at startup, so every render calls the same hook
  const useHostUser = getHost().useUser ?? noUser
  return useHostUser()
}
