import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import {
  CellEditingProvider,
  ProjectTableQueriesProvider,
  SelectedRowsProvider,
  SelectionCellsProvider,
} from '@shared/containers'
import { SettingsPanelProvider } from '@shared/context'
import { FC } from 'react'
import { VPProjectTableProvider } from './VPProjectTableProvider'
import { VPColumnSettingsProvider } from './VPColumnSettingsProvider'
import { VersionsDataProvider } from '../context/VPDataContext'
import { VPViewsProvider } from '../context/VPViewsContext'
import { VersionsSelectionProvider } from '../context/VPSelectionContext'
import { VPFocusProvider } from '../context/VPFocusContext'
import { useGroupByRemoteModules } from '@shared/hooks'
import { EntityListsProvider } from '@pages/ProjectListsPage/context'

interface VersionsProductsPageProvidersProps {
  projectName: string
  children: React.ReactNode
}

const VersionsProductsPageProviders: FC<VersionsProductsPageProvidersProps> = ({
  projectName,
  children,
}) => {
  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: projectName,
  })
  const modules = useGroupByRemoteModules()

  return (
    <VPViewsProvider>
      <VPFocusProvider>
        <VPColumnSettingsProvider>
          <VersionsDataProvider projectName={projectName} modules={modules}>
            <SettingsPanelProvider>
              <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
                <EntityListsProvider projectName={projectName}>
                  <VPProjectTableProvider projectName={projectName} modules={modules}>
                    <SelectionCellsProvider>
                      <SelectedRowsProvider>
                        <VersionsSelectionProvider>
                          <CellEditingProvider>{children}</CellEditingProvider>
                        </VersionsSelectionProvider>
                      </SelectedRowsProvider>
                    </SelectionCellsProvider>
                  </VPProjectTableProvider>
                </EntityListsProvider>
              </ProjectTableQueriesProvider>
            </SettingsPanelProvider>
          </VersionsDataProvider>
        </VPColumnSettingsProvider>
      </VPFocusProvider>
    </VPViewsProvider>
  )
}

export default VersionsProductsPageProviders
