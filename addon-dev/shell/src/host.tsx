// The shell's implementations of what @ynput/ayon-addon gets from its host. The project page
// layout, the slicer and the project list's table are AYON's own (shared); the dashboard's layout
// lives in the ayon-frontend app, so the shell draws a simple stand-in.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { provideHost } from '@ynput/ayon-addon/host'
import type { AddonUser, ProjectListProps, StudioPageLayoutProps } from '@ynput/ayon-addon'
import type { ExpandedState } from '@tanstack/react-table'
import {
  useGetCurrentUserQuery,
  useGetProjectFoldersQuery,
  usersApi,
} from '@ynput/ayon-frontend-shared/api'
import {
  AddonEntityPicker,
  AddonMoreMenu,
  ProjectPageLayoutHost,
  SlicerHost,
} from '@ynput/ayon-frontend-shared/components'
import { useGlobalContext, useMenuContext, usePowerpack } from '@ynput/ayon-frontend-shared/context'
import {
  buildProjectsTableData,
  parseProjectFolderRowId,
  PROJECTS_LIST_MENU_ID,
  ProjectsTable,
} from '@ynput/ayon-frontend-shared/ProjectsTable'
import { getProjectDisplayName } from '@ynput/ayon-frontend-shared/util'
import { useShellMenu } from './menus'

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

/** The project selection of the studio page on stage (AYON keeps one per page). */
export interface StudioSelection {
  selection: string[]
  onSelect: (selection: string[]) => void
}
export const StudioSelectionContext = createContext<StudioSelection | null>(null)

const StudioPageLayout = ({ sidebar, children }: StudioPageLayoutProps) => (
  <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: 0 }}>
    {sidebar && (
      <div
        style={{
          width: 240,
          flexShrink: 0,
          overflow: 'auto',
          borderRight: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        {sidebar}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex' }}>{children}</div>
  </div>
)

// AYON's project list table (shared), with the addon's menu items in its right-click menu and
// "more" dropdown. AYON's own items (open, pin, folders, archive) need the app: not here.
const ProjectList = ({ multiSelect = false }: ProjectListProps) => {
  const studio = useContext(StudioSelectionContext)
  const { projects: allProjects, isLoading } = useGlobalContext()
  const { powerLicense } = usePowerpack()
  const { data: folders } = useGetProjectFoldersQuery()
  const { toggleMenuOpen } = useMenuContext()
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [search, setSearch] = useState<string>()
  const selection = useMemo(() => studio?.selection || [], [studio?.selection])
  const projectNamesOf = (ids: string[]) => ids.filter((id) => !parseProjectFolderRowId(id))
  const { itemsFor } = useShellMenu('projectList.menuItem', (menu) => ({
    projectNames: projectNamesOf(selection),
    menu,
  }))

  // by name, as AYON sorts them (the archived ones aren't listed)
  const projects = useMemo(
    () =>
      [...allProjects.active].sort((a, b) =>
        getProjectDisplayName(a).localeCompare(getProjectDisplayName(b)),
      ),
    [allProjects.active],
  )
  const showFolders = !search && powerLicense
  const data = useMemo(
    () => buildProjectsTableData(projects, showFolders ? folders : [], true, powerLicense),
    [projects, folders, showFolders, powerLicense],
  )
  const onSelect = studio?.onSelect
  // like AYON's list: the first project when none is selected
  useEffect(() => {
    if (onSelect && !selection.length && projects.length) onSelect([projects[0].name])
  }, [onSelect, selection, projects])

  if (!studio) {
    return (
      <div role="alert" className="ayon-addon-error">
        ProjectList only works on a studio page.
      </div>
    )
  }

  return (
    <div data-shell-surface="project-list" style={{ display: 'flex', height: '100%' }}>
      <ProjectsTable
        data={data}
        isLoading={isLoading.projects}
        search={search}
        onSearch={setSearch}
        selection={selection}
        onSelect={studio.onSelect}
        onRowSelectionChange={(rows) => studio.onSelect(Object.keys(rows).filter((id) => rows[id]))}
        rowPinning={[]}
        expanded={expanded}
        setExpanded={setExpanded}
        multiSelect={multiSelect}
        hiddenButtons={multiSelect ? [] : ['select-all']}
        onSelectAll={() =>
          studio.onSelect(selection.length === projects.length ? [] : projects.map((p) => p.name))
        }
        toggleMenu={(open = true) => toggleMenuOpen(open ? PROJECTS_LIST_MENU_ID : false)}
        buildMenuItems={() =>
          itemsFor('dropdown').map(({ command, ...item }) => ({ ...item, onClick: command }))
        }
        rowContextMenuBuilders={[
          (_e, context) =>
            itemsFor('context', { projectNames: projectNamesOf(context.selectedRows) }),
        ]}
      />
    </div>
  )
}

// Must run before the first render.
export const provideShellHost = () =>
  provideHost({
    useUser,
    components: {
      ProjectPageLayout: ProjectPageLayoutHost,
      Slicer: SlicerHost,
      StudioPageLayout,
      ProjectList,
      EntityPicker: AddonEntityPicker,
      MoreMenu: AddonMoreMenu,
    },
  })

export const StudioSelectionProvider = ({
  value,
  children,
}: {
  value: StudioSelection
  children: ReactNode
}) => <StudioSelectionContext.Provider value={value}>{children}</StudioSelectionContext.Provider>
