import {
  ProjectDataProvider,
  useProjectDataContext,
} from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { FC, useMemo } from 'react'
import { ListsProvider, useListsContext } from './context/ListsContext'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section, Toolbar } from '@ynput/ayon-react-components'
import { ListsDataProvider } from './context/ListsDataContext'
import ListsTable from './components/ListsTable/ListsTable'
import ListInfoDialog from './components/ListInfoDialog/ListInfoDialog'
import ListsFiltersDialog from './components/ListsFiltersDialog/ListsFiltersDialog'
import { ListItemsDataProvider, useListItemsDataContext } from './context/ListItemsDataContext'
import {
  ListsAttributesProvider,
  useListsAttributesContext,
} from './context/ListsAttributesContext'
import ListItemsTable from './components/ListItemsTable/ListItemsTable'
import ListItemsFilter from './components/ListItemsFilter/ListItemsFilter'
import { CustomizeButton } from '@shared/components'
import { SettingsPanelProvider, useSettingsPanel } from '@shared/context'
import { useUsersPageConfig } from '@pages/ProjectOverviewPage/hooks/useUserPageConfig'
import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import {
  CellEditingProvider,
  ColumnSettingsProvider,
  ProjectTableProvider,
  ProjectTableQueriesProvider,
  SelectedRowsProvider,
  SelectionCellsProvider,
  TreeTableExtraColumn,
  useSelectedRowsContext,
} from '@shared/containers/ProjectTreeTable'
import ProjectOverviewDetailsPanel from '@pages/ProjectOverviewPage/containers/ProjectOverviewDetailsPanel'
import OverviewActions from '@pages/ProjectOverviewPage/components/OverviewActions'
import useExtraColumns from './hooks/useExtraColumns'
import { ListsTableSettings } from './components/ListsTableSettings/index.ts'
import useUpdateListItems from './hooks/useUpdateListItems'
import { Actions } from '@shared/containers/Actions/Actions'
import { ListsModuleProvider } from './context/ListsModulesContext.tsx'
import OpenReviewSessionButton from '@pages/ReviewPage/OpenReviewSessionButton.tsx'
import { useNavigate } from 'react-router'
import { useSearchParams } from 'react-router-dom'

type ProjectListsPageProps = {
  projectName: string
  entityListTypes?: string[]
  isReview?: boolean
}

const ProjectListsWithOuterProviders: FC<ProjectListsPageProps> = ({
  projectName,
  entityListTypes,
  isReview,
}) => {
  return (
    <ListsModuleProvider>
      <ProjectDataProvider projectName={projectName}>
        <ListsDataProvider entityListTypes={entityListTypes}>
          <ListsProvider isReview={isReview}>
            <ListItemsDataProvider>
              <ListsAttributesProvider>
                <ProjectListsWithInnerProviders isReview={isReview} />
              </ListsAttributesProvider>
            </ListItemsDataProvider>
          </ListsProvider>
        </ListsDataProvider>
      </ProjectDataProvider>
    </ListsModuleProvider>
  )
}

type ProjectListsWithInnerProvidersProps = {
  isReview?: boolean
}

const ProjectListsWithInnerProviders: FC<ProjectListsWithInnerProvidersProps> = ({ isReview }) => {
  const { projectName, selectedListId, contextMenuItems, attribFields, ...props } =
    useListItemsDataContext()
  const { selectedList } = useListsContext()
  const { listAttributes } = useListsAttributesContext()

  // merge attribFields with listAttributes
  const mergedAttribFields = useMemo(
    () => [
      ...listAttributes.map((a) => ({ ...a, scopes: [selectedList?.entityType] })),
      ...attribFields,
    ],
    [listAttributes, attribFields, selectedList],
  )

  const [pageConfig, updatePageConfig] = useUsersPageConfig({
    selectors: ['lists', projectName, selectedList?.label],
  })

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: projectName,
  })
  const { updateListItems } = useUpdateListItems({
    updateEntities,
  })

  const { extraColumns, extraColumnsSettings } = useExtraColumns({
    // @ts-expect-error - we do not support product right now
    entityType: selectedList?.entityType,
  })

  return (
    <SettingsPanelProvider>
      <ProjectTableQueriesProvider {...{ updateEntities: updateListItems, getFoldersTasks }}>
        <ProjectTableProvider
          projectName={projectName}
          attribFields={mergedAttribFields}
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
                  <ProjectLists
                    extraColumns={extraColumns}
                    extraColumnsSettings={extraColumnsSettings}
                    isReview={isReview}
                  />
                </CellEditingProvider>
              </ColumnSettingsProvider>
            </SelectedRowsProvider>
          </SelectionCellsProvider>
        </ProjectTableProvider>
      </ProjectTableQueriesProvider>
    </SettingsPanelProvider>
  )
}

type ProjectListsProps = {
  extraColumns: TreeTableExtraColumn[]
  extraColumnsSettings: any[]
  isReview?: boolean
}

const ProjectLists: FC<ProjectListsProps> = ({ extraColumns, extraColumnsSettings, isReview }) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projectName, projectInfo } = useProjectDataContext()
  const { isPanelOpen, selectSetting, highlightedSetting } = useSettingsPanel()
  const { selectedList } = useListsContext()
  const { selectedRows } = useSelectedRowsContext()
  const { deleteListItemAction } = useListItemsDataContext()

  const handleGoToCustomAttrib = (attrib: string) => {
    // open settings panel and highlig the attribute
    selectSetting('columns', attrib)
  }

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
            <ListsTable isReview={isReview} />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88}>
          <Section wrap direction="column" style={{ height: '100%' }}>
            {selectedList && (
              <Toolbar>
                <OverviewActions items={['undo', 'redo', deleteListItemAction]} />
                {/*@ts-expect-error - we do not support product right now*/}
                <ListItemsFilter entityType={selectedList.entityType} projectName={projectName} />
                <OpenReviewSessionButton projectName={projectName} />
                <Actions
                  entities={[
                    {
                      id: selectedList.id,
                      projectName,
                      entitySubType: `${selectedList.entityType}:${selectedList.entityListType}`,
                    },
                  ]}
                  entityType={'list'}
                  isLoadingEntity={false}
                  entitySubTypes={[`${selectedList.entityType}:${selectedList.entityListType}`]}
                  onNavigate={navigate}
                  onSetSearchParams={setSearchParams}
                  searchParams={searchParams}
                  featuredCount={0}
                />
                <CustomizeButton defaultSelected={null} />
              </Toolbar>
            )}
            <Splitter
              layout="horizontal"
              stateKey="overview-splitter-settings"
              stateStorage="local"
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
              gutterSize={isPanelOpen && selectedList ? 4 : 0}
            >
              <SplitterPanel size={82}>
                <Splitter
                  layout="horizontal"
                  stateKey="overview-splitter-details"
                  stateStorage="local"
                  style={{ width: '100%', height: '100%' }}
                  gutterSize={!selectedRows.length ? 0 : 4}
                >
                  <SplitterPanel size={70}>
                    {/* ITEMS TABLE */}
                    <ListItemsTable extraColumns={extraColumns} isReview={isReview} />
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
              {isPanelOpen && selectedList ? (
                <SplitterPanel
                  size={18}
                  style={{
                    zIndex: 500,
                  }}
                >
                  <ListsTableSettings
                    extraColumns={extraColumnsSettings}
                    highlightedSetting={highlightedSetting}
                    onGoTo={handleGoToCustomAttrib}
                  />
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
