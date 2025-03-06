import { useFiltersWithHierarchy } from '@components/SearchFilter/hooks'
import SearchFilterWrapper from '@components/SearchFilter/SearchFilterWrapper'
import { Filter } from '@components/SearchFilter/types'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { useSlicerContext } from '@context/slicerContext'
import { FilterFieldType } from '@hooks/useBuildFilterOptions'
import useUserFilters from '@hooks/useUserFilters'
import OverviewEditor from '@pages/ProjectOverviewPage/OverviewEditor/OverviewEditor'
import { $Any } from '@types'
import {
  Button,
  InputSwitch,
  Section,
  SortCardType,
  SortingDropdown,
  Toolbar,
} from '@ynput/ayon-react-components'
import { isEmpty } from 'lodash'
import { FC, useState } from 'react'
import useOverviewPreferences from './hooks/useOverviewPreferences'
import { SortByOption } from '@pages/UserDashboardPage/UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'

const sortByOptions: SortByOption[] = [
  { id: 'label', fallbacks: ['name'], label: 'Task', sortOrder: true },
  { id: 'status', label: 'Status', sortOrder: true },
  { id: 'priority', label: 'Priority', sortOrder: true, sortByEnumOrder: true },
]

// what to search by
const searchFilterTypes: FilterFieldType[] = ['attributes', 'status', 'assignees', 'tags']

interface ProjectOverviewMainProps {
  projectName: string
}

const ProjectOverviewMain: FC<ProjectOverviewMainProps> = ({ projectName }) => {
  // FILTERS vvv
  //
  //

  const { filters, setFilters } = useUserFilters({ page: 'overview', projectName })
  const { showHierarchy, updateShowHierarchy } = useOverviewPreferences()

  // filter out by slice
  const { rowSelection, sliceType, setPersistentRowSelectionData, persistentRowSelectionData } =
    useSlicerContext()
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

  //
  //
  // FILTERS ^^^

  return (
    <Section wrap direction="column" style={{ height: '100%' }}>
      <Toolbar style={{ gap: 4, maxHeight: '24px' }}>
        <Button icon={'add'} variant="filled" disabled>
          Create
        </Button>
        <SearchFilterWrapper
          filters={filtersWithHierarchy}
          onChange={handleFiltersChange}
          filterTypes={searchFilterTypes}
          projectNames={[projectName]}
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
        {/* <SortingDropdown
          style={{ minWidth: '250px' }}
          title="Sort by"
          options={sortByOptions}
          value={sortByValue}
          onChange={setSortByValue}
        /> */}
      </Toolbar>
      <OverviewEditor filters={filtersWithHierarchy} showHierarchy={showHierarchy} />
    </Section>
  )
}

export default ProjectOverviewMain
