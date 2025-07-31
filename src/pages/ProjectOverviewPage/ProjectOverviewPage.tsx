// libraries
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC, useCallback, useEffect } from 'react'

// state
import { useSlicerContext } from '@context/SlicerContext'

// containers
import Slicer from '@containers/Slicer'

// arc
import { Section, SwitchButton, Toolbar } from '@ynput/ayon-react-components'
import SearchFilterWrapper from './containers/SearchFilterWrapper'
import ProjectOverviewTable from './containers/ProjectOverviewTable'
import { FilterFieldType, OverviewSettingsChange } from '@shared/components'
import ProjectOverviewDetailsPanel from './containers/ProjectOverviewDetailsPanel'
import NewEntity from '@components/NewEntity/NewEntity'
import { Actions } from '@shared/containers/Actions/Actions'
import {
  useColumnSettingsContext,
  useSelectedRowsContext,
} from '@shared/containers/ProjectTreeTable'
import { useProjectOverviewContext } from './context/ProjectOverviewContext'
import { CustomizeButton } from '@shared/components'
import ProjectOverviewSettings from './containers/ProjectOverviewSettings'
import { useSettingsPanel } from '@shared/context'
import ReloadButton from './components/ReloadButton'
import OverviewActions from './components/OverviewActions'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@state/store'
import { OperationResponseModel } from '@shared/api'
import useExpandAndSelectNewFolders from './hooks/useExpandAndSelectNewFolders'
import { ViewsProvider, Views } from '@shared/containers/Views'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

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
    setQueryFilters,
    displayFilters,
    showHierarchy,
    updateShowHierarchy,
    tasksMap,
  } = useProjectOverviewContext()

  const { groupBy, updateGroupBy } = useColumnSettingsContext()

  const { isPanelOpen } = useSettingsPanel()

  // load slicer remote config
  const { config, sliceType, setPersistentRowSelectionData } = useSlicerContext()
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
      <Views />
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
