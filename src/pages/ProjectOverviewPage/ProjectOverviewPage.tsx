// libraries
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'

// state
import { useSlicerContext } from '@context/slicerContext'

// containers
import Slicer from '@containers/Slicer'

// arc
import { Filter, InputSwitch, Section, Toolbar } from '@ynput/ayon-react-components'
import SearchFilterWrapper from '@components/SearchFilter/SearchFilterWrapper'
import ProjectOverviewTable from './containers/ProjectOverviewTable'
import { isEmpty } from 'lodash'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { useFiltersWithHierarchy } from '@components/SearchFilter/hooks'
import { FilterFieldType } from '@hooks/useBuildFilterOptions'
import ProjectOverviewDetailsPanel from './containers/ProjectOverviewDetailsPanel'
import { useEntitySelection } from '@containers/ProjectTreeTable/context/EntitySelectionContext'
import NewEntity from '@components/NewEntity/NewEntity'
import { useProjectTableContext } from '@containers/ProjectTreeTable/context/ProjectTableContext'

const searchFilterTypes: FilterFieldType[] = [
  'attributes',
  'status',
  'assignees',
  'tags',
  // 'entitySubType', // current does not work correctly
]

const ProjectOverviewPage: FC = () => {
  const { selectedItems } = useEntitySelection()

  const { projectName, projectInfo, filters, setFilters, showHierarchy, updateShowHierarchy } =
    useProjectTableContext()

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
    setFilters(value)

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

  return (
    <main style={{ overflow: 'hidden' }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="overview-splitter-1"
        stateStorage="local"
      >
        <SplitterPanel size={12} minSize={2} style={{ maxWidth: 600 }}>
          <Section wrap>
            <Slicer sliceFields={overviewSliceFields} persistFieldId="hierarchy" />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88}>
          <Splitter
            layout="horizontal"
            stateKey="overview-splitter-2"
            stateStorage="local"
            style={{ width: '100%', height: '100%' }}
          >
            <SplitterPanel size={70}>
              <Section wrap direction="column" style={{ height: '100%' }}>
                <Toolbar style={{ gap: 4, maxHeight: '24px' }}>
                  <NewEntity projectInfo={projectInfo} />
                  <SearchFilterWrapper
                    filters={filtersWithHierarchy}
                    onChange={handleFiltersChange}
                    filterTypes={searchFilterTypes}
                    projectNames={projectName ? [projectName] : []}
                    scope="folder"
                    data={{
                      tags: [],
                      attributes: {},
                      assignees: [],
                    }}
                    disabledFilters={sliceType ? [sliceType] : []}
                  />
                  <span style={{ whiteSpace: 'nowrap', display: 'flex' }}>
                    Show hierarchy&nbsp;
                    <InputSwitch
                      checked={showHierarchy}
                      onChange={(e) => updateShowHierarchy((e.target as HTMLInputElement).checked)}
                    />
                  </span>
                </Toolbar>
                <ProjectOverviewTable />
              </Section>
            </SplitterPanel>
            {!!selectedItems.length ? (
              <SplitterPanel
                size={30}
                style={{
                  zIndex: 500,
                  minWidth: 300,
                }}
              >
                <ProjectOverviewDetailsPanel projectInfo={projectInfo} projectName={projectName} />
              </SplitterPanel>
            ) : (
              <SplitterPanel style={{ maxWidth: 0 }}></SplitterPanel>
            )}
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default ProjectOverviewPage
