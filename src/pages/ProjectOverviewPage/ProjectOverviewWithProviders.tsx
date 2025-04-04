import { EntitySelectionProvider } from '@containers/ProjectTreeTable/context/EntitySelectionContext'
import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import { ProjectTableProvider } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import { SelectionProvider } from '@containers/ProjectTreeTable/context/SelectionContext'
import { NewEntityProvider } from '@context/NewEntityContext'
import { SettingsPanelProvider } from './contexts/SettingsPanelContext'
import { SelectedRowsProvider } from '@containers/ProjectTreeTable/context/SelectedRowsContext'
import { ProjectDataProvider } from '@containers/ProjectTreeTable/context/ProjectDataContext'

const ProjectOverviewWithProviders: FC = () => {
  return (
    <EntitySelectionProvider>
      <ProjectDataProvider>
        <ProjectTableProvider>
          <SelectionProvider>
            <SelectedRowsProvider>
              <NewEntityProvider>
                <SettingsPanelProvider>
                  <ProjectOverviewPage />
                </SettingsPanelProvider>
              </NewEntityProvider>
            </SelectedRowsProvider>
          </SelectionProvider>
        </ProjectTableProvider>
      </ProjectDataProvider>
    </EntitySelectionProvider>
  )
}

export default ProjectOverviewWithProviders
