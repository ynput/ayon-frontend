import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import {
  ProjectTableProvider,
  SelectionProvider,
  SelectedRowsProvider,
  ProjectDataProvider,
} from '@containers/ProjectTreeTable'
import { NewEntityProvider } from '@context/NewEntityContext'
import { SettingsPanelProvider } from './contexts/SettingsPanelContext'

const ProjectOverviewWithProviders: FC = () => {
  return (
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
  )
}

export default ProjectOverviewWithProviders
