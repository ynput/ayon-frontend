// libraries
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'

// state
import { useSlicerContext } from '@context/SlicerContext'

// containers
import Slicer from '@containers/Slicer'

// arc
import { Section, SwitchButton, Toolbar } from '@ynput/ayon-react-components'
import SearchFilterWrapper from './containers/SearchFilterWrapper'
import ProjectOverviewTable from './containers/ProjectOverviewTable'
import { FilterFieldType } from '@shared/components'
import ProjectOverviewDetailsPanel from './containers/ProjectOverviewDetailsPanel'
import NewEntity from '@components/NewEntity/NewEntity'
import { Actions } from '@shared/containers/Actions/Actions'
import {
  useColumnSettingsContext,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { useProjectOverviewContext } from './context/ProjectOverviewContext'
import { CustomizeButton } from '@shared/components'
import ProjectOverviewSettings from './containers/ProjectOverviewSettings'
import { useSettingsPanel } from '@shared/context'
import ReloadButton from './components/ReloadButton'
import OverviewActions from './components/OverviewActions'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@state/store'
import { DetailsPanelEntityData, OperationResponseModel } from '@shared/api'
import useExpandAndSelectNewFolders from './hooks/useExpandAndSelectNewFolders'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import useGoToEntity from '../../hooks/useGoToEntity'

const searchFilterTypes: FilterFieldType[] = [
  'attributes',
  'status',
  'assignees',
  'tags',
  'taskType',
]

const ProjectOverviewPage: FC = () => {
  const user = useAppSelector((state) => state.user?.attrib)
  const isDeveloperMode = user?.developerMode ?? false

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    projectName,
    projectInfo,
    setQueryFilters,
    displayFilters,
    showHierarchy,
    updateShowHierarchy,
    tasksMap,
    updateExpanded,
  } = useProjectOverviewContext()

  const { updateGroupBy } = useColumnSettingsContext()

  const { isPanelOpen } = useSettingsPanel()
  //   table contexts
  const { setSelectedCells } = useSelectionCellsContext()

  // load slicer remote config
  const { config, sliceType, setPersistentRowSelectionData, ...slicer } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  const handleFiltersChange = (newQueryFilters: QueryFilter) => {
    // Update the stored QueryFilter directly
    setQueryFilters(newQueryFilters)

    // check if we need to clear hierarchy selection
    // This is a simplified check - you might need to implement QueryFilter inspection
    // to determine if hierarchy filter is present
    if (
      !newQueryFilters.conditions?.some(
        (condition) => 'key' in condition && condition.key === 'hierarchy',
      )
    ) {
      setPersistentRowSelectionData({})
    }
  }

  const handleShowHierarchy = () => updateShowHierarchy(!showHierarchy)

  const expandAndSelectNewFolders = useExpandAndSelectNewFolders()

  // select new entities and expand their parents
  const handleNewEntities = (ops: OperationResponseModel[], stayOpen: boolean) => {
    // expands to newly created folders and selects them
    expandAndSelectNewFolders(ops, { enableSelect: !stayOpen, enableExpand: true })
  }

  const { goToEntity } = useGoToEntity({
    page: 'overview',
    onViewUpdate: () => {
      // clear all filters
      setQueryFilters({})
      // remove any group by
      updateGroupBy(undefined)
      // ensure hierarchy is shown
      updateShowHierarchy(true)
    },
    onExpandFolders: (expanded, selected) => {
      updateExpanded(expanded) // expand table folders
      slicer.setExpanded(expanded) // expand slicer folders
      slicer.setRowSelection(selected) // select folders in slicer (actually one folder)
    }, // expand folders
    onSelection: (selectedIds: string[]) => setSelectedCells(new Set(selectedIds)), // select entities
  })

  // select the entity in the table and expand its parent folders
  const handleUriOpen = (entity: DetailsPanelEntityData) => {
    console.debug('URI found, selecting and expanding folders to entity:', entity.name)
    goToEntity(entity.id, entity.entityType, { folder: entity.folder?.id })
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
            <Slicer sliceFields={overviewSliceFields} persistFieldId="hierarchy" />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88}>
          <Section wrap direction="column" style={{ height: '100%' }}>
            <Toolbar>
              <NewEntity disabled={!showHierarchy} onNewEntities={handleNewEntities} />
              <OverviewActions />
              <SearchFilterWrapper
                queryFilters={displayFilters}
                onChange={handleFiltersChange}
                filterTypes={searchFilterTypes}
                scope="task"
                projectNames={projectName ? [projectName] : []}
                projectInfo={projectInfo}
                tasksMap={tasksMap}
                disabledFilters={sliceType ? [sliceType] : []}
              />
              <ReloadButton />
              <SwitchButton
                value={showHierarchy}
                onClick={handleShowHierarchy}
                label="Show hierarchy"
              />
              <Actions
                entities={[]}
                entityType={undefined}
                isLoadingEntity={false}
                projectActionsProjectName={projectName}
                onNavigate={navigate}
                onSetSearchParams={setSearchParams}
                searchParams={searchParams}
                isDeveloperMode={isDeveloperMode}
                align="right"
              />
              <CustomizeButton />
            </Toolbar>
            <Splitter
              layout="horizontal"
              stateKey="overview-splitter-settings"
              stateStorage="local"
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
              gutterSize={!isPanelOpen ? 0 : 4}
            >
              <SplitterPanel size={82}>
                <DetailsPanelSplitter
                  layout="horizontal"
                  stateKey="overview-splitter-details"
                  stateStorage="local"
                  style={{ width: '100%', height: '100%' }}
                >
                  <SplitterPanel size={70}>
                    <ProjectOverviewTable />
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
                      onUriOpen={handleUriOpen}
                    />
                  </SplitterPanel>
                </DetailsPanelSplitter>
              </SplitterPanel>
              {isPanelOpen ? (
                <SplitterPanel
                  size={18}
                  style={{
                    zIndex: 500,
                  }}
                >
                  <ProjectOverviewSettings />
                </SplitterPanel>
              ) : (
                <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
              )}
            </Splitter>
          </Section>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default ProjectOverviewPage
