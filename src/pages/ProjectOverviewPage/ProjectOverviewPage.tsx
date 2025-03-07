// libraries
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC, useMemo } from 'react'

// state
import { useAppSelector } from '@state/store'
import { useSlicerContext } from '@context/slicerContext'

// containers
import Slicer from '@containers/Slicer'

// arc
import { Button, Filter, InputSwitch, Section, Toolbar } from '@ynput/ayon-react-components'
import SearchFilterWrapper from '@components/SearchFilter/SearchFilterWrapper'
import ProjectOverviewTable from './containers/ProjectOverviewTable'
import { isEmpty } from 'lodash'
import useLocalStorage from '@hooks/useLocalStorage'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { useFiltersWithHierarchy } from '@components/SearchFilter/hooks'
import { RowSelectionState } from '@tanstack/react-table'
import { FilterFieldType } from '@hooks/useBuildFilterOptions'
import ProjectOverviewDetailsPanel from './containers/ProjectOverviewDetailsPanel'
import { useGetProjectQuery } from '@queries/project/getProject'
import { EntitySelectionProvider } from '@containers/ProjectTreeTable/context/EntitySelectionContext'

const searchFilterTypes: FilterFieldType[] = [
  'attributes',
  'status',
  'assignees',
  'tags',
  // 'entitySubType', // current does not work correctly
]

const ProjectOverviewPage: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  const { data: projectInfo } = useGetProjectQuery({ projectName }, { skip: !projectName })

  // load slicer remote config
  const {
    config,
    rowSelection,
    sliceType,
    setPersistentRowSelectionData,
    persistentRowSelectionData,
  } = useSlicerContext()
  const overviewSliceFields = config?.overview?.fields

  const [filters, setFilters] = useLocalStorage<Filter[]>(`overview-filters-${projectName}`, [])
  const [showHierarchy, updateShowHierarchy] = useLocalStorage<boolean>(
    `overview-show-hierarchy-${projectName}`,
    true,
  )

  // filter out by slice
  const persistedHierarchySelection = isEmpty(persistentRowSelectionData)
    ? null
    : persistentRowSelectionData
  const { filter: sliceFilter } = useFilterBySlice()

  // merge the slice filter with the user filters
  let combinedFilters = [...filters]
  if (sliceFilter) {
    combinedFilters.push(sliceFilter)
  }

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

  const selectedFolders: RowSelectionState = useMemo(() => {
    if (sliceType === 'hierarchy') {
      return rowSelection
    } else if (persistedHierarchySelection) {
      return Object.values(persistedHierarchySelection).reduce((acc: any, item) => {
        acc[item.id] = !!item
        return acc
      }, {})
    } else return {}
  }, [rowSelection, persistedHierarchySelection, sliceType])

  return (
    <EntitySelectionProvider>
      <main style={{ overflow: 'hidden' }}>
        <Splitter
          layout="horizontal"
          style={{ width: '100%', height: '100%' }}
          stateKey="overview-splitter-1"
        >
          <SplitterPanel size={18} style={{ minWidth: 100, maxWidth: 600 }}>
            <Section wrap>
              <Slicer sliceFields={overviewSliceFields} persistFieldId="hierarchy" />
            </Section>
          </SplitterPanel>
          <SplitterPanel size={90}>
            <Section wrap direction="column" style={{ height: '100%' }}>
              <Toolbar style={{ gap: 4, maxHeight: '24px' }}>
                <Button icon={'add'} variant="filled" disabled>
                  Create
                </Button>
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
              <ProjectOverviewTable
                selectedFolders={Object.entries(selectedFolders)
                  .filter(([, value]) => value)
                  .map(([id]) => id)}
                filters={combinedFilters}
                showHierarchy={showHierarchy}
                projectName={projectName}
                projectInfo={projectInfo}
              />
            </Section>
          </SplitterPanel>
          {true ? (
            <SplitterPanel
              size={20}
              style={{
                minWidth: 300,
                maxWidth: 800,
                zIndex: 500,
              }}
            >
              <ProjectOverviewDetailsPanel projectInfo={projectInfo} projectName={projectName} />
            </SplitterPanel>
          ) : (
            <SplitterPanel size={0} style={{ maxWidth: 0 }}></SplitterPanel>
          )}
        </Splitter>
      </main>
    </EntitySelectionProvider>
  )
}

export default ProjectOverviewPage
