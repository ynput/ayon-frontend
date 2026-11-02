// The host's EntityTable (@ynput/ayon-addon): the Overview's task and folder lists and the
// Products versions table for an addon's rows. Registered with provideHost by the app (it uses the
// pages' data layers, so the standalone dev shell has none). See src/remote/AGENTS.md.
import type { ReactNode } from 'react'
import type { EntityTableProps } from '@ynput/ayon-addon'
import { EmptyPlaceholder } from '@shared/components'
import {
  DetailsPanelEntityProvider,
  ProjectDataContext,
  ProjectDataProvider,
} from '@shared/containers/ProjectTreeTable'
import {
  ProjectContextProvider,
  ProjectFoldersContextProvider,
  useOptionalProjectContext,
  useOptionalProjectFoldersContext,
} from '@shared/context'
import { useContext } from 'react'
import { OverviewEntityTable } from './OverviewEntityTable'
import { VersionsEntityTable } from './VersionsEntityTable'

const EMPTY_MESSAGES: Record<EntityTableProps['entityType'], string> = {
  task: 'No tasks',
  folder: 'No folders',
  version: 'No versions',
}

// The project's providers the table reads, where the page has none or they are another project's
// (a studio page, a dialog for another project). On a project page they are the page's.
const ProjectProviders = ({ projectName, children }: { projectName: string; children: ReactNode }) => {
  const project = useOptionalProjectContext()
  const folders = useOptionalProjectFoldersContext()
  const data = useContext(ProjectDataContext)

  if (project?.projectName !== projectName) {
    return (
      <ProjectContextProvider projectName={projectName}>
        <ProjectFoldersContextProvider projectName={projectName}>
          <ProjectDataProvider projectName={projectName}>{children}</ProjectDataProvider>
        </ProjectFoldersContextProvider>
      </ProjectContextProvider>
    )
  }
  if (folders?.projectName !== projectName) {
    return (
      <ProjectFoldersContextProvider projectName={projectName}>
        <ProjectDataProvider projectName={projectName}>{children}</ProjectDataProvider>
      </ProjectFoldersContextProvider>
    )
  }
  if (!data) return <ProjectDataProvider projectName={projectName}>{children}</ProjectDataProvider>
  return <>{children}</>
}

export const AddonEntityTable = (props: EntityTableProps) => {
  // no ids: no rows (an empty id list would mean "not narrowed" to the queries)
  if (props.ids && !props.ids.length) {
    return <EmptyPlaceholder message={EMPTY_MESSAGES[props.entityType]} />
  }

  return (
    <ProjectProviders projectName={props.projectName}>
      {/* the table's row selection, apart from the page's details panel */}
      <DetailsPanelEntityProvider>
        {props.entityType === 'version' ? (
          <VersionsEntityTable {...props} />
        ) : (
          <OverviewEntityTable {...props} entityType={props.entityType} />
        )}
      </DetailsPanelEntityProvider>
    </ProjectProviders>
  )
}
