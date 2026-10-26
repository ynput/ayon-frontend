// The shell's implementations of what @ynput/ayon-addon gets from its host. The project page
// layout and the slicer are AYON's own (shared); the dashboard's layout and project list live in
// the ayon-frontend app, so the shell draws simple stand-ins with the same behaviour.
import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { provideHost } from '@ynput/ayon-addon/host'
import type { AddonUser, ProjectListProps, StudioPageLayoutProps } from '@ynput/ayon-addon'
import { useGetCurrentUserQuery, useListProjectsQuery } from '@ynput/ayon-frontend-shared/api'
import { ProjectPageLayoutHost, SlicerHost } from '@ynput/ayon-frontend-shared/components'
import { useShellMenu } from './menus'

type UserData = { isAdmin?: boolean; isManager?: boolean; isGuest?: boolean; isService?: boolean }

const useUser = (): AddonUser | undefined => {
  const { data: user } = useGetCurrentUserQuery()
  return useMemo(() => {
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
      isDeveloper: !!user.attrib?.developerMode || !!data.isService,
    }
  }, [user])
}

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

const ProjectList = ({ multiSelect = false }: ProjectListProps) => {
  const studio = useContext(StudioSelectionContext)
  const { data: projects = [] } = useListProjectsQuery({ active: true })
  const selected = studio?.selection || []
  const { openContextMenu, dropdown } = useShellMenu('projectList.menuItem', (menu) => ({
    projectNames: selected,
    menu,
  }))

  if (!studio) {
    return (
      <div role="alert" className="ayon-addon-error">
        ProjectList only works on a studio page.
      </div>
    )
  }

  const toggle = (name: string, additive: boolean) => {
    if (!multiSelect || !additive) return studio.onSelect(selected.includes(name) ? [] : [name])
    studio.onSelect(
      selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name],
    )
  }

  return (
    <div data-shell-surface="project-list" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="ayon-shell-bar" style={{ height: 40 }}>
        <span>Projects</span>
        <span className="ayon-shell-approximated" title="The shell's stand-in for AYON's project list">
          approximated
        </span>
        <span className="spacer" />
        {dropdown}
      </div>
      <table className="ayon-shell-table">
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.name}
              className={selected.includes(project.name) ? 'selected' : undefined}
              onClick={(e) => toggle(project.name, e.metaKey || e.ctrlKey || e.shiftKey)}
              onContextMenu={(e) => {
                if (!selected.includes(project.name)) studio.onSelect([project.name])
                openContextMenu(e, { projectNames: selected.includes(project.name) ? selected : [project.name] })
              }}
              style={{ cursor: 'pointer' }}
            >
              <td>{project.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    },
  })

export const StudioSelectionProvider = ({
  value,
  children,
}: {
  value: StudioSelection
  children: ReactNode
}) => <StudioSelectionContext.Provider value={value}>{children}</StudioSelectionContext.Provider>
