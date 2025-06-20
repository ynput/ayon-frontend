import { ProjectDataProvider, useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { FC, useMemo, useState } from 'react' // Added useState
import { ListsProvider, useListsContext } from './context'
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
import { useUserProjectConfig } from '@shared/hooks'
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
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
// Dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
  type Active,
  type Over,
} from '@dnd-kit/core'
import { useAppSelector } from '@state/store.ts'
import useTableOpenViewer from '@pages/ProjectOverviewPage/hooks/useTableOpenViewer.ts'

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
        <ListsDataProvider entityListTypes={entityListTypes} isReview={isReview}>
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

  const [pageConfig, updatePageConfig] = useUserProjectConfig({
    selectors: ['lists', projectName, selectedList?.label],
  })

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

  // DND State and Handlers
  const [dndActiveId, setDndActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {}),
  )

  function handleDndDragStart(event: DragStartEvent) {
    setDndActiveId(event.active.id)
  }

  function handleDndDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      if (reorderListItem) {
        // Type assertion if necessary, or ensure reorderListItem matches (Active, Over)
        reorderListItem(active as Active, over as Over)
      }
    }
    setDndActiveId(null)
  }

  function handleDndDragCancel() {
    setDndActiveId(null)
  }

  const handleOpenPlayer = useTableOpenViewer({ projectName: projectName })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDndDragStart}
      onDragEnd={handleDndDragEnd}
      onDragCancel={handleDndDragCancel}
    >
      <SettingsPanelProvider>
        <ColumnSettingsProvider config={pageConfig} onChange={updatePageConfig}>
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
              scopes={[selectedList?.entityType]}
              onOpenPlayer={handleOpenPlayer}
            >
              <SelectionCellsProvider>
                <SelectedRowsProvider>
                  <CellEditingProvider>
                    <ProjectLists
                      extraColumns={extraColumns}
                      extraColumnsSettings={extraColumnsSettings}
                      isReview={isReview}
                      dndActiveId={dndActiveId}
                    />
                  </CellEditingProvider>
                </SelectedRowsProvider>
              </SelectionCellsProvider>
            </ProjectTableProvider>
          </ProjectTableQueriesProvider>
        </ColumnSettingsProvider>
      </SettingsPanelProvider>
    </DndContext>
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
                  isDeveloperMode={isDeveloperMode}
                />
                <CustomizeButton />
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
                    <ListItemsTable
                      extraColumns={extraColumns}
                      isReview={isReview}
                      dndActiveId={dndActiveId} // Pass prop
                    />
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
