import { EntitySelectionProvider } from '@containers/ProjectTreeTable/context/EntitySelectionContext'
import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import { ProjectTableProvider } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import { SelectionProvider } from '@containers/ProjectTreeTable/context/SelectionContext'
import { NewEntityProvider } from '@context/NewEntityContext'

const ProjectOverviewWithProviders: FC = () => {
  return (
    <EntitySelectionProvider>
      <ProjectTableProvider>
        <SelectionProvider>
          <NewEntityProvider>
            <ProjectOverviewPage />
          </NewEntityProvider>
        </SelectionProvider>
      </ProjectTableProvider>
    </EntitySelectionProvider>
  )
}

export default ProjectOverviewWithProviders
