import { useFiltersWithHierarchy } from '@components/SearchFilter/hooks'
import SearchFilterWrapper from '@components/SearchFilter/SearchFilterWrapper'
import { Filter } from '@components/SearchFilter/types'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { useSlicerContext } from '@context/slicerContext'
import { FilterFieldType } from '@hooks/useBuildFilterOptions'
import useUserFilters from '@hooks/useUserFilters'
import OverviewEditor from '@pages/ProjectOverviewPage/OverviewEditor/OverviewEditor'
import { Button, InputSwitch, Section, Toolbar } from '@ynput/ayon-react-components'
import { isEmpty } from 'lodash'
import { FC, useMemo } from 'react'
import useOverviewPreferences from './hooks/useOverviewPreferences'
import { RowSelectionState } from '@tanstack/react-table'

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
      </Toolbar>
      <OverviewEditor
        selectedFolders={Object.entries(selectedFolders)
          .filter(([, value]) => value)
          .map(([id]) => id)}
        filters={combinedFilters}
        showHierarchy={showHierarchy}
      />
    </Section>
  )
}

export default ProjectOverviewMain
