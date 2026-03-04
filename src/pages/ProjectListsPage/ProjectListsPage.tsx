import { ProjectDataProvider } from '@shared/containers/ProjectTreeTable'
import { FC, useMemo, useState } from 'react'
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
import { CustomizeButton, EmptyPlaceholder, TableGridSwitch } from '@shared/components'
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
  TreeTableExtraColumn
} from '@shared/containers/ProjectTreeTable'
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
import ListsShortcuts from './components/ListsShortcuts.tsx'
import { useViewsContext } from '@shared/containers/index.ts'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter.ts'
import DndContextWrapper from './components/DndContextWrapper'
import { toast } from 'react-toastify'
import api from '@shared/api/index.ts'
import useReviewSessionCardsModules from './hooks/useReviewSessionCardsModules.tsx'
import ReviewCardsSettings from './components/ReviewCardsSettings/ReviewCardsSettings.tsx'
import { ReviewCardsSettingsProvider, useReviewCardsSettingsContext } from './context/ReviewCardsSettingsContext.tsx'
import ProjectListsDetailsPanels from './components/ProjectListsDetailsPanels/ProjectListsDetailsPanels.tsx'

type ProjectListsPageProps = {
  projectName: string
  entityListTypes?: string[]
  isReview?: boolean
}

export type ReviewPageView = "table" | "cards"

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
  const { projectName } = useProjectContext()
  const { isPanelOpen, selectSetting, highlightedSetting } = useSettingsPanel()
  const { selectedList } = useListsContext()
  const { listItemsData, deleteListItemAction } = useListItemsDataContext()

  const detailsPanel = useDetailsPanelContext()
  const [view, setView] = useState<ReviewPageView>(isReview ? "cards" : "table")

  const handleGoToCustomAttrib = (attrib: string) => {
    // open settings panel and highlig the attribute
    selectSetting('columns', attrib)
  }

  const { gridHeight } = useReviewCardsSettingsContext()

  const {
    ReviewSessionCards,
    ReviewSessionCardsProvider,
    ReviewSessionCardsControlsLeft,
    ReviewSessionCardsControlsRight,
    outdated: reviewSessionCardsOutdated,
  } = useReviewSessionCardsModules({ skip: !isReview })

  const handleOpenPlayer = useTableOpenViewer({ projectName: projectName })

  if (reviewSessionCardsOutdated) {
    return (
      <EmptyPlaceholder
        message={
          `The Review addon version (${reviewSessionCardsOutdated.current}) is out of date.`
        }
      >
        Please update to version {reviewSessionCardsOutdated.required} or newer.
      </EmptyPlaceholder>
    )
  }

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
                if (versionIds.length === 0) {
                  detailsPanel.setEntities(null)
                  return
                }

                detailsPanel.setEntities({
                  entityType: "version",
                  entities: versionIds.map((id) => ({ id, projectName })),
                })
              }}
              onOpenInViewer={(state) => {
                handleOpenPlayer(state, { quickView: true })
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
                    isReview && (
                      <>
                        <Spacer />
                        <ReviewSessionCardsControlsRight groupingDisabled={view === "table"} />
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
                        gridFirst
                        showGrid={view === "cards"}
                        onChange={(showGrid) => setView(showGrid ? "cards" : "table")}
                      />
                    )
                  }
                  <CustomizeButton />
                  <OpenReviewSessionButton
                    projectName={projectName}
                    disabled={listItemsData.length === 0}
                  />
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
                        selectedList && isReview && view === "cards"
                        ? <ReviewSessionCards />
                        : (
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
                      <ProjectListsDetailsPanels isReview={!!isReview} view={view} />
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
