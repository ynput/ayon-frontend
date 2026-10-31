import { provideHost } from '@ynput/ayon-addon/host'
import type { AddonUser } from '@ynput/ayon-addon'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import store, { useAppSelector } from '@state/store'
import { ProjectPageLayoutHost, SlicerHost } from '@shared/components/AddonLayout/AddonLayout'
import { ProjectListHost, StudioPageLayoutHost } from './AddonLayout'

// The host's implementations of what @ynput/ayon-addon exports but can't build itself
// (it imports nothing from this app). See src/remote/AGENTS.md.

type UserState = ReturnType<typeof store.getState>['user']

const toAddonUser = (user: UserState): AddonUser | undefined =>
  user.name
    ? {
        name: user.name,
        fullName: user.attrib?.fullName || undefined,
        email: user.attrib?.email || undefined,
        isAdmin: !!user.data?.isAdmin,
        isManager: !!user.data?.isManager || !!user.data?.isAdmin,
        isGuest: !!user.data?.isGuest,
        // set by the server's /users/me; the slice's initial state doesn't list it
        isService: !!(user.data as { isService?: boolean } | undefined)?.isService,
        isDeveloper: !!user.attrib?.developerMode,
      }
    : undefined

const useUser = (): AddonUser | undefined => {
  const user = useAppSelector((state) => state.user)
  return useMemo(() => toAddonUser(user), [user])
}

// Must run before the first render.
export const provideAddonHost = () =>
  provideHost({
    useUser,
    getUser: () => toAddonUser(store.getState().user),
    dispatch: store.dispatch,
    components: {
      ProjectPageLayout: ProjectPageLayoutHost,
      Slicer: SlicerHost,
      StudioPageLayout: StudioPageLayoutHost,
      ProjectList: ProjectListHost,
    },
  })

// Gives the package the router's navigate (navigateToEntity). Render it inside <BrowserRouter>.
export const AddonHostNavigation = () => {
  const navigate = useNavigate()
  useEffect(() => provideHost({ navigate: (to) => navigate(to) }), [navigate])
  return null
}
