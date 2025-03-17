import { EntitySelectionProvider } from '@containers/ProjectTreeTable/context/EntitySelectionContext'
import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import { ProjectTableProvider } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import { SelectionProvider } from '@containers/ProjectTreeTable/context/SelectionContext'

const ProjectOverviewWithProviders: FC = () => {
  return (
    <EntitySelectionProvider>
      <ProjectTableProvider>
        <SelectionProvider>
          <ProjectOverviewPage />
        </SelectionProvider>
      </ProjectTableProvider>
    </EntitySelectionProvider>
  )
}

export default ProjectOverviewWithProviders
