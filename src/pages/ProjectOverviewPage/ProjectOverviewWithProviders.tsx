import { EntitySelectionProvider } from '@containers/ProjectTreeTable/context/EntitySelectionContext'
import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import { ProjectTableProvider } from '@containers/ProjectTreeTable/context/ProjectTableContext'

const ProjectOverviewWithProviders: FC = () => {
  return (
    <EntitySelectionProvider>
      <ProjectTableProvider>
        <ProjectOverviewPage />
      </ProjectTableProvider>
    </EntitySelectionProvider>
  )
}

export default ProjectOverviewWithProviders
