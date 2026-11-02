// The host's implementations of StudioPageLayout and ProjectList from @ynput/ayon-addon
// (registered in addonHost.ts): the dashboard's project list and splitter. The project page ones
// are in shared (AddonLayout).
import type { ProjectListProps, StudioPageLayoutProps } from '@ynput/ayon-addon'
import { SplitterPanel } from 'primereact/splitter'
import ProjectsList, { PROJECTS_LIST_WIDTH_KEY } from '@containers/ProjectsList/ProjectsList'
import { ProjectsListSplitter } from '@pages/UserDashboardPage/UserDashboardPage.styled'
import { StudioPageSelectionContext, useStudioPageSelection } from './StudioPageSelectionContextInstance'
import type { StudioPageSelection } from './StudioPageSelectionContextInstance'

export const StudioPageLayoutHost = ({ sidebar, children }: StudioPageLayoutProps) => {
  if (!sidebar) return <>{children}</>
  return (
    <ProjectsListSplitter stateKey={PROJECTS_LIST_WIDTH_KEY} stateStorage="local">
      <SplitterPanel size={15}>{sidebar}</SplitterPanel>
      <SplitterPanel size={100} style={{ overflow: 'hidden' }}>
        {children}
      </SplitterPanel>
    </ProjectsListSplitter>
  )
}

export const ProjectListHost = ({ multiSelect = false }: ProjectListProps) => {
  const studioPage = useStudioPageSelection()
  if (!studioPage) {
    return (
      <div role="alert" className="ayon-addon-error">
        ProjectList only works on a studio page.
      </div>
    )
  }
  return (
    <ProjectsList
      multiSelect={multiSelect}
      selection={studioPage.selection}
      onSelect={studioPage.onSelect}
      onNewProject={studioPage.onNewProject}
    />
  )
}

export const StudioPageSelectionProvider = ({
  value,
  children,
}: {
  value: StudioPageSelection
  children: React.ReactNode
}) => (
  <StudioPageSelectionContext.Provider value={value}>{children}</StudioPageSelectionContext.Provider>
)
