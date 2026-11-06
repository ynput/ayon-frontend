import { provideHost } from '@ynput/ayon-addon/host'
import type { AddonUser } from '@ynput/ayon-addon'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import store from '@state/store'
import { openViewer } from '@state/viewer'
import { ProjectPageLayoutHost, SlicerHost } from '@shared/components/AddonLayout/AddonLayout'
import { AddonEntityPicker } from '@shared/components/AddonLayout/AddonEntityPicker'
import { AddonMoreMenu } from '@shared/components/AddonLayout/AddonMoreMenu'
import { ProjectListHost, StudioPageLayoutHost } from './AddonLayout'
import { LazyEntityTable } from './EntityTable/LazyEntityTable'

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

// Reads the host's store, not the nearest redux Provider's: addons render host components inside
// their own store (e.g. the review addon's session cards), which has no user.
const useUser = (): AddonUser | undefined => {
  const user = useSyncExternalStore(store.subscribe, () => store.getState().user)
  return useMemo(() => toAddonUser(user), [user])
}

// Must run before the first render.
export const provideAddonHost = () =>
  provideHost({
    useUser,
    getUser: () => toAddonUser(store.getState().user),
    dispatch: store.dispatch,
    openViewer: (target) => {
      store.dispatch(openViewer(target))
    },
    components: {
      ProjectPageLayout: ProjectPageLayoutHost,
      Slicer: SlicerHost,
      StudioPageLayout: StudioPageLayoutHost,
      ProjectList: ProjectListHost,
      EntityPicker: AddonEntityPicker,
      MoreMenu: AddonMoreMenu,
      EntityTable: LazyEntityTable,
    },
  })

// Gives the package the router's navigate (navigate, navigateToEntity). Render it inside <BrowserRouter>.
export const AddonHostNavigation = () => {
  const navigate = useNavigate()
  useEffect(() => provideHost({ navigate: (to) => navigate(to) }), [navigate])
  return null
}
