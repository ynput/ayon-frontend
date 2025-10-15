import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import {
  CellEditingProvider,
  DetailsPanelEntityProvider,
  ProjectDataProvider,
  ProjectTableQueriesProvider,
  SelectedRowsProvider,
  SelectionCellsProvider,
} from '@shared/containers'
import { MoveEntityProvider, SettingsPanelProvider } from '@shared/context'
import { FC } from 'react'
import { VersionsProjectTableProvider } from './VersionsProjectTableProvider'
import { VersionsColumnSettingsProvider } from './VersionsColumnSettingsProvider'
import { VersionsDataProvider } from '../context/VersionsDataContext'

interface VersionsProvidersProps {
  projectName: string
  children: React.ReactNode
}

const VersionsProviders: FC<VersionsProvidersProps> = ({ projectName, children }) => {
  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: projectName,
  })

  return (
    <VersionsDataProvider projectName={projectName}>
      <ProjectDataProvider projectName={projectName}>
        <MoveEntityProvider>
          <SettingsPanelProvider>
            <VersionsColumnSettingsProvider>
              <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
                <VersionsProjectTableProvider projectName={projectName}>
                  <DetailsPanelEntityProvider>
                    <SelectionCellsProvider>
                      <SelectedRowsProvider>
                        <CellEditingProvider>{children}</CellEditingProvider>
                      </SelectedRowsProvider>
                    </SelectionCellsProvider>
                  </DetailsPanelEntityProvider>
                </VersionsProjectTableProvider>
              </ProjectTableQueriesProvider>
            </VersionsColumnSettingsProvider>
          </SettingsPanelProvider>
        </MoveEntityProvider>
      </ProjectDataProvider>
    </VersionsDataProvider>
  )
}

export default VersionsProviders
