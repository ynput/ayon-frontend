import { EntitySelectionProvider } from '@containers/ProjectTreeTable/context/EntitySelectionContext'
import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'

const ProjectOverviewWithProviders: FC = ({}) => {
  return (
    <EntitySelectionProvider>
      <ProjectOverviewPage />
    </EntitySelectionProvider>
  )
}

export default ProjectOverviewWithProviders
