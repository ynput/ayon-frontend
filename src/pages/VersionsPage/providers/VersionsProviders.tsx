import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import {
  CellEditingProvider,
  DetailsPanelEntityProvider,
  ProjectDataProvider,
  ProjectTableQueriesProvider,
  SelectedRowsProvider,
  SelectionCellsProvider,
  useVersionsViewSettings,
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

  const { columns, onUpdateColumns, ...config } = useVersionsViewSettings()

  return (
    <ProjectDataProvider projectName={projectName}>
      <VersionsDataProvider projectName={projectName} config={config}>
        <MoveEntityProvider>
          <SettingsPanelProvider>
            <VersionsColumnSettingsProvider columns={columns} onUpdateColumns={onUpdateColumns}>
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
      </VersionsDataProvider>
    </ProjectDataProvider>
  )
}

export default VersionsProviders
