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
import { VersionsViewsProvider } from '../context/VersionsViewsContext'
import { VersionsSelectionProvider } from '../context/VersionsSelectionContext'
import { useGroupByRemoteModules } from '@shared/hooks'

interface VersionsProvidersProps {
  projectName: string
  children: React.ReactNode
}

const VersionsProviders: FC<VersionsProvidersProps> = ({ projectName, children }) => {
  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: projectName,
  })
  const modules = useGroupByRemoteModules()

  return (
    <VersionsViewsProvider>
      <ProjectDataProvider projectName={projectName}>
        <VersionsDataProvider projectName={projectName} modules={modules}>
          <MoveEntityProvider>
            <SettingsPanelProvider>
              <VersionsColumnSettingsProvider>
                <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
                  <VersionsProjectTableProvider projectName={projectName} modules={modules}>
                    <DetailsPanelEntityProvider>
                      <SelectionCellsProvider>
                        <SelectedRowsProvider>
                          <VersionsSelectionProvider>
                            <CellEditingProvider>{children}</CellEditingProvider>
                          </VersionsSelectionProvider>
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
    </VersionsViewsProvider>
  )
}

export default VersionsProviders
