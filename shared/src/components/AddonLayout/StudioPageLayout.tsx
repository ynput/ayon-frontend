// The host's implementations of StudioPageLayout and ProjectList from @ynput/ayon-addon
// (registered in src/remote/addonHost.ts and by the addon dev shell): the dashboard's splitter and
// project list. The app passes the list what needs its routes and store (open, manage, ...).
import type { ReactNode } from 'react'
import type { ProjectListProps, StudioPageLayoutProps } from '@ynput/ayon-addon'
import { SplitterPanel } from 'primereact/splitter'
import ProjectsList from '@shared/containers/ProjectsTable/ProjectsList/ProjectsList'
import type { ProjectsListProps } from '@shared/containers/ProjectsTable/ProjectsList/ProjectsList'
import { ProjectsListSplitter } from '@shared/containers/ProjectsTable/ProjectsList/ProjectsList.styled'
import { PROJECTS_LIST_WIDTH_KEY } from '@shared/containers/ProjectsTable/ProjectsList/ProjectsListHelpers'
import {
  StudioPageSelectionContext,
  useStudioPageSelection,
} from './StudioPageSelectionContextInstance'
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

export type ProjectListHostProps = ProjectListProps &
  Omit<ProjectsListProps, 'selection' | 'onSelect' | 'multiSelect'>

export const ProjectListHost = ({ multiSelect = false, ...listProps }: ProjectListHostProps) => {
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
      onNewProject={studioPage.onNewProject}
      {...listProps}
      multiSelect={multiSelect}
      selection={studioPage.selection}
      onSelect={studioPage.onSelect}
    />
  )
}

export const StudioPageSelectionProvider = ({
  value,
  children,
}: {
  value: StudioPageSelection
  children: ReactNode
}) => (
  <StudioPageSelectionContext.Provider value={value}>{children}</StudioPageSelectionContext.Provider>
)
