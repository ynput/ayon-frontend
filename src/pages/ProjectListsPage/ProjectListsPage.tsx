import {
  ProjectDataProvider,
  useProjectDataContext,
} from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { useAppSelector } from '@state/store'
import { FC } from 'react'
import { ListsProvider, useListsContext } from './context/ListsContext'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section, Toolbar } from '@ynput/ayon-react-components'
import { ListsDataProvider } from './context/ListsDataContext'
import ListsTable from './components/ListsTable/ListsTable'
import ListInfoDialog from './components/ListInfoDialog/ListInfoDialog'
import ListsFiltersDialog from './components/ListsFiltersDialog/ListsFiltersDialog'
import { ListItemsDataProvider, useListItemsDataContext } from './context/ListItemsDataContext'
import ListItemsTable from './components/ListItemsTable/ListItemsTable'
import ListItemsFilter from './components/ListItemsFilter/ListItemsFilter'
import ProjectOverviewSettings, {
  CustomizeButton,
} from '@pages/ProjectOverviewPage/components/ProjectOverviewSettings'
import {
  SettingsPanelProvider,
  useSettingsPanel,
} from '@pages/ProjectOverviewPage/context/SettingsPanelContext'
import { useUsersPageConfig } from '@pages/ProjectOverviewPage/hooks/useUserPageConfig'
import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import {
  CellEditingProvider,
  ColumnSettingsProvider,
  ProjectTableProvider,
  ProjectTableQueriesProvider,
  SelectedRowsProvider,
  SelectionCellsProvider,
  useSelectedRowsContext,
} from '@shared/containers/ProjectTreeTable'
import ProjectOverviewDetailsPanel from '@pages/ProjectOverviewPage/containers/ProjectOverviewDetailsPanel'
import OverviewActions from '@pages/ProjectOverviewPage/components/OverviewActions'
import useExtraColumns from './hooks/useExtraColumns'

const ProjectListsWithOuterProviders: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  return (
    <ProjectDataProvider projectName={projectName}>
      <ListsDataProvider>
        <ListsProvider>
          <ListItemsDataProvider>
            <ProjectListsWithInnerProviders />
          </ListItemsDataProvider>
        </ListsProvider>
      </ListsDataProvider>
    </ProjectDataProvider>
  )
}

const ProjectListsWithInnerProviders: FC = () => {
  const { projectName, selectedListId, contextMenuItems, ...props } = useListItemsDataContext()
  const { selectedList } = useListsContext()

  const [pageConfig, updatePageConfig] = useUsersPageConfig({
    selectors: ['lists', projectName, selectedList?.label],
  })

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: projectName,
  })

  return (
    <SettingsPanelProvider>
      <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
        <ProjectTableProvider
          projectName={projectName}
          attribFields={props.attribFields}
          projectInfo={props.projectInfo}
          users={props.users}
          // @ts-ignore
          entitiesMap={props.listItemsMap}
          foldersMap={props.foldersMap}
          tasksMap={props.tasksMap}
          tableRows={props.listItemsTableData}
          expanded={{}}
          isInitialized={props.isInitialized}
          showHierarchy={false}
          isLoading={props.isLoadingAll}
          contextMenuItems={contextMenuItems}
          sorting={props.sorting}
          updateSorting={props.updateSorting}
        >
          <SelectionCellsProvider>
            <SelectedRowsProvider>
              <ColumnSettingsProvider config={pageConfig} onChange={updatePageConfig}>
                <CellEditingProvider>
                  <ProjectListsPage />
                </CellEditingProvider>
              </ColumnSettingsProvider>
            </SelectedRowsProvider>
          </SelectionCellsProvider>
        </ProjectTableProvider>
      </ProjectTableQueriesProvider>
    </SettingsPanelProvider>
  )
}

const ProjectListsPage: FC = () => {
  const { projectName, projectInfo } = useProjectDataContext()
  const { isPanelOpen } = useSettingsPanel()
  const { selectedList } = useListsContext()
  const { selectedRows } = useSelectedRowsContext()
  const { deleteListItemAction } = useListItemsDataContext()

  const { extraColumns, extraColumnsSettings } = useExtraColumns({
    // @ts-expect-error - we do not support product right now
    entityType: selectedList?.entityType,
  })

  return (
    <main style={{ overflow: 'hidden', gap: 4 }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="overview-splitter-table"
        stateStorage="local"
      >
        <SplitterPanel size={12} minSize={2} style={{ maxWidth: 600 }}>
          <Section wrap>
            <ListsTable />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88}>
          <Section wrap direction="column" style={{ height: '100%' }}>
            {selectedList && (
              <Toolbar>
                <OverviewActions items={['undo', 'redo', deleteListItemAction]} />
                {/*@ts-expect-error - we do not support product right now*/}
                <ListItemsFilter entityType={selectedList.entityType} projectName={projectName} />
                <CustomizeButton />
              </Toolbar>
            )}
            <Splitter
              layout="horizontal"
              stateKey="overview-splitter-settings"
              stateStorage="local"
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            >
              <SplitterPanel size={82}>
                <Splitter
                  layout="horizontal"
                  stateKey="overview-splitter-details"
                  stateStorage="local"
                  style={{ width: '100%', height: '100%' }}
                >
                  <SplitterPanel size={70}>
                    {/* ITEMS TABLE */}
                    <ListItemsTable extraColumns={extraColumns} />
                  </SplitterPanel>
                  {!!selectedRows.length ? (
                    <SplitterPanel
                      size={30}
                      style={{
                        zIndex: 300,
                        minWidth: 300,
                      }}
                    >
                      <ProjectOverviewDetailsPanel
                        projectInfo={projectInfo}
                        projectName={projectName}
                      />
                    </SplitterPanel>
                  ) : (
                    <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
                  )}
                </Splitter>
              </SplitterPanel>
              {isPanelOpen ? (
                <SplitterPanel
                  size={18}
                  style={{
                    zIndex: 500,
                  }}
                >
                  <ProjectOverviewSettings extraColumns={extraColumnsSettings} />
                </SplitterPanel>
              ) : (
                <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
              )}
            </Splitter>
          </Section>
        </SplitterPanel>
      </Splitter>
      <ListInfoDialog />
      <ListsFiltersDialog />
    </main>
  )
}

export default ProjectListsWithOuterProviders
