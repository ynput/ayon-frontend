import { EntitySelectionProvider } from '@containers/ProjectTreeTable/context/EntitySelectionContext'
import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import { ProjectTableProvider } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import { SelectionProvider } from '@containers/ProjectTreeTable/context/SelectionContext'
import { NewEntityProvider } from '@context/NewEntityContext'
import { SettingsPanelProvider } from './contexts/SettingsPanelContext'
import { SelectedRowsProvider } from '@containers/ProjectTreeTable/context/SelectedRowsContext'

const ProjectOverviewWithProviders: FC = () => {
  return (
    <EntitySelectionProvider>
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
    </EntitySelectionProvider>
  )
}

export default ProjectOverviewWithProviders
