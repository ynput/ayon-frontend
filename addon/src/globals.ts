// Things that are the same in every slot. They are imports; the user is also in every slot's
// context (`user`), for code that isn't a component.
import { getHost } from './hostBridge'
import type { AddonDispatch, AddonUser } from './hostBridge'

const noUser = (): AddonUser | undefined => undefined

/**
 * The signed-in user. `undefined` only while AYON is still signing in. A contribution's code also
 * gets it as `user` in its context.
 */
export const useUser = (): AddonUser | undefined => {
  // the host registers its implementation once at startup, so every render calls the same hook
  const useHostUser = getHost().useUser ?? noUser
  return useHostUser()
}

/**
 * Goes to an AYON URL without reloading the page, for code outside React such as `run` and `menu`
 * pieces: `navigate('/dashboard/comments')`. Components use `useNavigate` instead.
 */
export const navigate = (to: string) => {
  const hostNavigate = getHost().navigate
  if (hostNavigate) hostNavigate(to)
  else window.location.assign(to)
}

/**
 * Dispatches to AYON's store, for code outside React such as `run` and `menu` pieces:
 * `await dispatch(api.endpoints.getProject.initiate({ projectName })).unwrap()`. Components use
 * the api's hooks instead.
 */
export const dispatch: AddonDispatch = ((action: Parameters<AddonDispatch>[0]) => {
  const hostDispatch = getHost().dispatch
  if (!hostDispatch) throw new Error('AYON has not provided its store yet')
  return hostDispatch(action)
}) as AddonDispatch
