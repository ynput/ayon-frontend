// libraries
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC, useCallback, useEffect } from 'react'

// state
import { useSlicerContext } from '@context/SlicerContext'

// containers
import Slicer from '@containers/Slicer'

// arc
import { Filter, Section, SwitchButton, Toolbar } from '@ynput/ayon-react-components'
import SearchFilterWrapper from './containers/SearchFilterWrapper'
import ProjectOverviewTable from './containers/ProjectOverviewTable'
import { isEmpty } from 'lodash'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { FilterFieldType, OverviewSettingsChange } from '@shared/components'
import ProjectOverviewDetailsPanel from './containers/ProjectOverviewDetailsPanel'
import NewEntity from '@components/NewEntity/NewEntity'
import { Actions } from '@shared/containers/Actions/Actions'
import {
  useColumnSettingsContext,
  useProjectTableContext,
  useSelectedRowsContext,
} from '@shared/containers/ProjectTreeTable'
import { CustomizeButton } from '@shared/components'
import ProjectOverviewSettings from './containers/ProjectOverviewSettings'
import { useSettingsPanel } from '@shared/context'
import ReloadButton from './components/ReloadButton'
import OverviewActions from './components/OverviewActions'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFiltersWithHierarchy } from '@shared/containers'
import { useAppSelector } from '@state/store'
import { OperationResponseModel } from '@shared/api'
import useExpandAndSelectNewFolders from './hooks/useExpandAndSelectNewFolders'
import { ViewsProvider, ViewsComponents } from '@shared/components'

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
  const { selectedRows } = useSelectedRowsContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    projectName,
    projectInfo,
    filters,
    setFilters,
    showHierarchy,
    updateShowHierarchy,
    tasksMap,
  } = useProjectTableContext()

  const { groupBy, updateGroupBy } = useColumnSettingsContext()

  const { isPanelOpen } = useSettingsPanel()

  // load slicer remote config
  const { config, sliceType, setPersistentRowSelectionData, persistentRowSelectionData } =
    useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  // filter out by slice
  const persistedHierarchySelection = isEmpty(persistentRowSelectionData)
    ? null
    : persistentRowSelectionData

  const { filter: sliceFilter } = useFilterBySlice()

  const handleFiltersChange = (value: Filter[]) => {
    // make sure to remove the hierarchy filter from the new value
    const newValue = value.filter((filter) => filter.id !== 'hierarchy')
    setFilters(newValue)

    // check if we need to remove the hierarchy filter and clear hierarchy selection
    if (!value.some((filter) => filter.id === 'hierarchy')) {
      setPersistentRowSelectionData({})
    }
  }

  // if the sliceFilter is not hierarchy and hierarchy is not empty
  // add the hierarchy to the filters as disabled
  const filtersWithHierarchy = useFiltersWithHierarchy({
    sliceFilter,
    persistedHierarchySelection,
    filters,
  })

  const handleSettingsChange = useCallback<OverviewSettingsChange>(
    (setting, value) => {
      if (setting === 'group-by') {
        if (value !== undefined && showHierarchy) {
          // turn hierarchy off
          updateShowHierarchy(false)
        }
      }
    },
    [showHierarchy, updateShowHierarchy],
  )

  // if groupBy is set and showHierarchy is true, turn off hierarchy
  useEffect(() => {
    if (groupBy && showHierarchy) {
      updateShowHierarchy(false)
    }
  }, [groupBy, showHierarchy, updateShowHierarchy])

  const handleShowHierarchy = () => {
    // update hierarchy
    updateShowHierarchy(!showHierarchy)
    // remove grouping
    if (groupBy) {
      updateGroupBy(undefined)
    }
  }

  const expandAndSelectNewFolders = useExpandAndSelectNewFolders()

  // select new entities and expand their parents
  const handleNewEntities = (ops: OperationResponseModel[], stayOpen: boolean) => {
    // expands to newly created folders and selects them
    expandAndSelectNewFolders(ops, { enableSelect: !stayOpen, enableExpand: true })
  }

  return (
    <ViewsProvider viewType="overview" projectName={projectName}>
      <ViewsComponents />
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
                  filters={filtersWithHierarchy}
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
                  <Splitter
                    layout="horizontal"
                    stateKey="overview-splitter-details"
                    stateStorage="local"
                    style={{ width: '100%', height: '100%' }}
                    gutterSize={!selectedRows.length ? 0 : 4}
                  >
                    <SplitterPanel size={70}>
                      <ProjectOverviewTable />
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
                    <ProjectOverviewSettings onChange={handleSettingsChange} />
                  </SplitterPanel>
                ) : (
                  <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
                )}
              </Splitter>
            </Section>
          </SplitterPanel>
        </Splitter>
      </main>
    </ViewsProvider>
  )
}

export default ProjectOverviewPage
