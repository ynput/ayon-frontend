// The shell's implementations of what @ynput/ayon-addon gets from its host: AYON's own (shared)
// project page and studio page layouts, slicer and project list.
import { useMemo } from 'react'
import { provideHost } from '@ynput/ayon-addon/host'
import type { AddonUser, ProjectListProps } from '@ynput/ayon-addon'
import { useGetCurrentUserQuery, usersApi } from '@ynput/ayon-frontend-shared/api'
import {
  AddonEntityPicker,
  AddonMoreMenu,
  ProjectListHost,
  ProjectPageLayoutHost,
  SlicerHost,
  StudioPageLayoutHost,
  useAddonContextMenu,
} from '@ynput/ayon-frontend-shared/components'
import type { ProjectsListHidden } from '@ynput/ayon-frontend-shared/ProjectsTable'
import { devSlots } from './slotOverlay'

type UserData = { isAdmin?: boolean; isManager?: boolean; isGuest?: boolean; isService?: boolean }

type CurrentUser = {
  name?: string
  attrib?: { fullName?: string | null; email?: string | null; developerMode?: boolean | null }
  data?: unknown
}

const toAddonUser = (user: CurrentUser | undefined): AddonUser | undefined => {
  if (!user?.name) return undefined
  const data = (user.data || {}) as UserData
  // the server treats service users (API key) as admins, so does AYON
  const isAdmin = !!data.isAdmin || !!data.isService
  return {
    name: user.name,
    fullName: user.attrib?.fullName || undefined,
    email: user.attrib?.email || undefined,
    isAdmin,
    isManager: isAdmin || !!data.isManager,
    isGuest: !!data.isGuest,
    isService: !!data.isService,
    isDeveloper: !!user.attrib?.developerMode || !!data.isService,
  }
}

const useUser = (): AddonUser | undefined => {
  const { data: user } = useGetCurrentUserQuery()
  return useMemo(() => toAddonUser(user), [user])
}

/** The user outside React (`run` and `menu` pieces), from the store the shell's queries use. */
export const getShellUser = (state: object) =>
  toAddonUser(usersApi.endpoints.getCurrentUser.select()(state as never).data)

// AYON's project list (shared) without what needs the app (open, manage, new project) and without
// the items that change projects or folders on the server: the shell previews, it saves nothing.
const SHELL_HIDDEN: ProjectsListHidden = {
  'add-project': true,
  'archive-project': true,
  'delete-project': true,
  'delete-folder': true,
  'edit-label': true,
  'edit-folder': true,
  'rename-folder': true,
  'create-folder': true,
  'move-project': true,
}

const ProjectList = (props: ProjectListProps) => (
  <div data-shell-surface="project-list" style={{ display: 'flex', height: '100%' }}>
    <ProjectListHost {...props} hidden={SHELL_HIDDEN} />
  </div>
)

// Must run before the first render.
export const provideShellHost = () =>
  provideHost({
    useUser,
    useContextMenu: useAddonContextMenu,
    // Show slots: outlines and placeholders of the slots rendered with the SDK
    devSlots,
    components: {
      ProjectPageLayout: ProjectPageLayoutHost,
      Slicer: SlicerHost,
      StudioPageLayout: StudioPageLayoutHost,
      ProjectList,
      EntityPicker: AddonEntityPicker,
      MoreMenu: AddonMoreMenu,
    },
  })
