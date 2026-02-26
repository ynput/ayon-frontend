import {
  ProjectDataProvider,
  useDetailsPanelEntityContext,
  useProjectTableContext,
  isEntityRestricted,
  useSelectionCellsContext,
  getCellId,
  ROW_SELECTION_COLUMN_ID,
} from '@shared/containers/ProjectTreeTable'
import { FC, useEffect, useMemo, useState } from 'react'
import { ListsProvider, useListsContext } from './context'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { ListsDataProvider } from './context/ListsDataContext'
import ListsTable from './components/ListsTable/ListsTable'
import ListsFiltersDialog from './components/ListsFiltersDialog/ListsFiltersDialog'
import { ListItemsDataProvider, useListItemsDataContext } from './context/ListItemsDataContext'
import {
  ListsAttributesProvider,
  useListsAttributesContext,
} from './context/ListsAttributesContext'
import ListItemsTable from './components/ListItemsTable/ListItemsTable'
import ListItemsFilter from './components/ListItemsFilter/ListItemsFilter'
import { CustomizeButton, TableGridSwitch } from '@shared/components'
import {
  MoveEntityProvider,
  SettingsPanelProvider,
  useDetailsPanelContext,
  useProjectContext,
  useSettingsPanel,
  useSubtasksModulesContext,
} from '@shared/context'
import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import {
  CellEditingProvider,
  ColumnSettingsProvider,
  DetailsPanelEntityProvider,
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
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@state/store.ts'
import { UniqueIdentifier } from '@dnd-kit/core'
import useTableOpenViewer from '@pages/ProjectOverviewPage/hooks/useTableOpenViewer'
import ListDetailsPanel from './components/ListDetailsPanel/ListDetailsPanel.tsx'
import ListsShortcuts from './components/ListsShortcuts.tsx'
import { useViewsContext } from '@shared/containers/index.ts'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter.ts'
import DndContextWrapper from './components/DndContextWrapper'
import { toast } from 'react-toastify'
import api from '@shared/api/index.ts'
import useReviewSessionCards from './hooks/useReviewSessionCards'
import ReviewCardsSettings from './components/ReviewCardsSettings/ReviewCardsSettings.tsx'
import { ReviewCardsSettingsProvider, useReviewCardsSettingsContext } from './context/ReviewCardsSettingsContext.tsx'

type ProjectListsPageProps = {
  projectName: string
  entityListTypes?: string[]
  isReview?: boolean
}

type ReviewPageView = "table" | "cards"

const ProjectListsWithOuterProviders: FC<ProjectListsPageProps> = ({
  projectName,
  entityListTypes,
  isReview,
}) => {
  // lists page does not support grouping yet
  const modules = undefined

  return (
    <ReviewCardsSettingsProvider>
      <ListsModuleProvider>
        <ProjectDataProvider projectName={projectName}>
          <ListsDataProvider entityListTypes={entityListTypes} isReview={isReview}>
            <ListsProvider isReview={isReview}>
              <ListItemsDataProvider>
                <ListsAttributesProvider>
                  <MoveEntityProvider>
                    <ProjectListsWithInnerProviders isReview={isReview} modules={modules} />
                  </MoveEntityProvider>
                </ListsAttributesProvider>
              </ListItemsDataProvider>
            </ListsProvider>
          </ListsDataProvider>
        </ProjectDataProvider>
      </ListsModuleProvider>
    </ReviewCardsSettingsProvider>
  )
}

type ProjectListsWithInnerProvidersProps = {
  isReview?: boolean
  modules?: any
}

const ProjectListsWithInnerProviders: FC<ProjectListsWithInnerProvidersProps> = ({
  isReview,
  modules,
}) => {
  const { projectName, ...projectInfo } = useProjectContext()
  const { selectedListId, contextMenuItems, attribFields, columns, onUpdateColumns, ...props } =
    useListItemsDataContext()
  const { selectedList } = useListsContext()
  const { listAttributes } = useListsAttributesContext()
  const { resetWorkingView } = useViewsContext()
  const { SubtasksManager } = useSubtasksModulesContext()

  // merge attribFields with listAttributes
  const mergedAttribFields = useMemo(
    () => [
      ...listAttributes.map((a) => ({ ...a, scope: [selectedList?.entityType] })),
      ...attribFields,
    ],
    [listAttributes, attribFields, selectedList],
  )

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: projectName,
  })
  const { updateListItems } = useUpdateListItems({
    updateEntities,
  })
  const { reorderListItem } = useListItemsDataContext() // Get reorderListItem

  const { extraColumns, extraColumnsSettings } = useExtraColumns({
    // @ts-expect-error - we do not support product right now
    entityType: selectedList?.entityType,
  })

  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)
  const handleOpenPlayer = useTableOpenViewer({ projectName: projectName })

  return (
    <SettingsPanelProvider>
      <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
        <DndContextWrapper reorderListItem={reorderListItem}>
          {(dndActiveId) => (
            <ProjectTableQueriesProvider {...{ updateEntities: updateListItems, getFoldersTasks }}>
              <ProjectTableProvider
                projectName={projectName}
                attribFields={mergedAttribFields}
                projectInfo={projectInfo}
                users={props.users}
                modules={modules}
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
                scopes={[selectedList?.entityType]}
                playerOpen={viewerOpen}
                onOpenPlayer={handleOpenPlayer}
                onResetView={(selectedList?.count || 0) > 0 ? resetWorkingView : undefined}
                SubtasksManager={SubtasksManager}
                useParams={useParams}
                useNavigate={useNavigate}
                useLocation={useLocation}
                useSearchParams={useSearchParams}
              >
                <DetailsPanelEntityProvider>
                  <SelectionCellsProvider>
                    <SelectedRowsProvider>
                      <CellEditingProvider>
                        <ProjectLists
                          extraColumns={extraColumns}
                          extraColumnsSettings={extraColumnsSettings}
                          isReview={isReview}
                          dndActiveId={dndActiveId}
                        />
                        <ListsShortcuts />
                      </CellEditingProvider>
                    </SelectedRowsProvider>
                  </SelectionCellsProvider>
                </DetailsPanelEntityProvider>
              </ProjectTableProvider>
            </ProjectTableQueriesProvider>
          )}
        </DndContextWrapper>
      </ColumnSettingsProvider>
    </SettingsPanelProvider>
  )
}

type ProjectListsProps = {
  extraColumns: TreeTableExtraColumn[]
  extraColumnsSettings: any[]
  isReview?: boolean
  dndActiveId?: UniqueIdentifier | null // Added prop
}

const ProjectLists: FC<ProjectListsProps> = ({
  extraColumns,
  extraColumnsSettings,
  isReview,
  dndActiveId, // Destructure new prop
}) => {
  const user = useAppSelector((state) => state.user?.attrib)
  const isDeveloperMode = user?.developerMode ?? false
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projectName, ...projectInfo } = useProjectContext()
  const { getEntityById } = useProjectTableContext()
  const { isPanelOpen, selectSetting, highlightedSetting } = useSettingsPanel()
  const { selectedList, listDetailsOpen } = useListsContext()
  const { selectedRows } = useSelectedRowsContext()
  const { setSelectedCells } = useSelectionCellsContext()
  const {
    deleteListItemAction,
    listItemsData,
    isLoadingAll: isLoadingListItems,
    listItemsFilters,
    setListItemsFilters,
  } = useListItemsDataContext()

  const detailsPanel = useDetailsPanelContext()
  const [view, setView] = useState<ReviewPageView>(isReview ? "cards" : "table")

  // Try to get the entity context, but it might not exist
  let selectedEntity: { entityId: string; entityType: 'folder' | 'task' } | null
  try {
    const entityContext = useDetailsPanelEntityContext()
    selectedEntity = entityContext.selectedEntity
  } catch {
    // Context not available, that's fine
    selectedEntity = null
  }

  // Check if any selected rows are restricted entities
  const hasNonRestrictedSelectedRows = selectedRows.some((rowId) => {
    const entity = getEntityById(rowId)
    return entity && !isEntityRestricted(entity.entityType)
  })

  // Check if we should show the details panel
  // Don't show entity details panel if only selected entity is restricted
  const shouldShowEntityDetailsPanel =
    (selectedRows.length > 0 || selectedEntity !== null) && hasNonRestrictedSelectedRows
  const shouldShowListDetailsPanel = listDetailsOpen && !!selectedList

  const handleGoToCustomAttrib = (attrib: string) => {
    // open settings panel and highlig the attribute
    selectSetting('columns', attrib)
  }

  // Handle URI opening to select list item
  // We use state and effect because the uri callback can be called before data is loaded
  const [uriEntityId, setUriEntityId] = useState<null | string>(null)
  useEffect(() => {
    if (!uriEntityId) return

    // if there are filters, we need to remove them first
    if (listItemsFilters.conditions?.length) {
      setListItemsFilters({})
      return
      // now the list items data will reload without filters, and the effect will run again
    }

    if (isLoadingListItems || !listItemsData.length) return

    setUriEntityId(null)
    console.debug('URI found, navigating to list item:', uriEntityId)

    // find the list item by entity id
    const listItem = listItemsData.find((item) => item.entityId === uriEntityId)
    if (!listItem) {
      console.warn('List item not found for entity ID:', uriEntityId)
      return
    }

    // select the list item in the table
    // Select the entity in the table
    setSelectedCells(
      new Set([getCellId(listItem.id, 'name'), getCellId(listItem.id, ROW_SELECTION_COLUMN_ID)]),
    )
  }, [uriEntityId, isLoadingListItems, listItemsData, listItemsFilters])

  const { gridHeight } = useReviewCardsSettingsContext()

  const {
    ReviewSessionCards,
    ReviewSessionCardsProvider,
    ReviewSessionCardsControlsLeft,
    ReviewSessionCardsControlsRight,
  } = useReviewSessionCards({ skip: !isReview })

  return (
    <main style={{ gap: 4 }}>
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
            <ReviewSessionCardsProvider
              projectName={projectName}
              router={{
                useParams,
                useNavigate,
                useLocation,
                useSearchParams,
              }}
              api={api}
              toast={toast}
              gridSize={gridHeight}
              onSelectionChange={(versionIds) => {
                if (versionIds.length === 0 && detailsPanel.entities?.entityType === "version") {
                  detailsPanel.setEntities(null)
                  return
                }

                detailsPanel.setEntities({
                  entityType: "version",
                  entities: versionIds.map((id) => ({ id, projectName })),
                })
              }}
            >
              {selectedList && (
                <Toolbar>
                  {
                    view === "cards" && (
                      <ReviewSessionCardsControlsLeft />
                    )
                  }
                  {
                    view === "table" && (
                      <>
                        <OverviewActions items={['undo', 'redo', deleteListItemAction]} />
                        {/*@ts-expect-error - we do not support product right now*/}
                        <ListItemsFilter entityType={selectedList.entityType} projectName={projectName} />
                      </>
                    )
                  }
                  {
                    view === "cards" && (
                      <>
                        <Spacer />
                        <ReviewSessionCardsControlsRight />
                      </>
                    )
                  }
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
                    isDeveloperMode={isDeveloperMode}
                    align="right"
                  />
                  {
                    isReview && (
                      <TableGridSwitch
                        showGrid={view === "cards"}
                        onChange={(showGrid) => setView(showGrid ? "cards" : "table")}
                      />
                    )
                  }
                  <CustomizeButton />
                  <OpenReviewSessionButton projectName={projectName} />
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
                  <DetailsPanelSplitter
                    layout="horizontal"
                    stateKey="overview-splitter-details"
                    stateStorage="local"
                    style={{ width: '100%', height: '100%' }}
                  >
                    <SplitterPanel size={70}>
                      {
                        selectedList && isReview && view === "cards" && (
                          <ReviewSessionCards />
                        )
                      }
                      {
                        selectedList && (!isReview || view === "table") && (
                          <ListItemsTable
                            extraColumns={extraColumns}
                            isReview={isReview}
                            dndActiveId={dndActiveId} // Pass prop
                            viewOnly={(selectedList?.accessLevel || 0) < 20}
                          />
                        )
                      }
                    </SplitterPanel>
                    <SplitterPanel
                      size={30}
                      style={{
                        zIndex: 300,
                        minWidth: 300,
                      }}
                      className="details"
                    >
                      <ProjectOverviewDetailsPanel
                        projectInfo={projectInfo}
                        projectName={projectName}
                        isOpen={shouldShowEntityDetailsPanel}
                        onUriOpen={(entity) => setUriEntityId(entity.id)}
                      />
                      {selectedList &&
                        !shouldShowEntityDetailsPanel &&
                        shouldShowListDetailsPanel && (
                          <ListDetailsPanel listId={selectedList.id} projectName={projectName} />
                        )}
                    </SplitterPanel>
                  </DetailsPanelSplitter>
                </SplitterPanel>
                {isPanelOpen && selectedList ? (
                  <SplitterPanel
                    size={18}
                    style={{
                      zIndex: 500,
                    }}
                  >
                    {
                      view === "table" ? (
                        <ListsTableSettings
                          extraColumns={extraColumnsSettings}
                          highlightedSetting={highlightedSetting}
                          onGoTo={handleGoToCustomAttrib}
                        />
                      ) : (
                        <ReviewCardsSettings />
                      )
                    }
                  </SplitterPanel>
                ) : (
                  <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
                )}
              </Splitter>
            </ReviewSessionCardsProvider>
          </Section>
        </SplitterPanel>
      </Splitter>
      <ListsFiltersDialog />
    </main>
  )
}

export default ProjectListsWithOuterProviders
