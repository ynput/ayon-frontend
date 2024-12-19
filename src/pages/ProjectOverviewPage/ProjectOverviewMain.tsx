import { useFiltersWithHierarchy } from '@components/SearchFilter/hooks'
import SearchFilterWrapper from '@components/SearchFilter/SearchFilterWrapper'
import { Filter } from '@components/SearchFilter/types'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { useSlicerContext } from '@context/slicerContext'
import { FilterFieldType } from '@hooks/useBuildFilterOptions'
import useUserFilters from '@hooks/useUserFilters'
import NewEditorPage from '@pages/NewEditor/NewEditorPage'
import { Button, Section, Toolbar } from '@ynput/ayon-react-components'
import { isEmpty } from 'lodash'
import { FC } from 'react'

// what to search by
const searchFilterTypes: FilterFieldType[] = [
  'attributes',
  'entitySubType',
  'status',
  'assignees',
  'tags',
]

interface ProjectOverviewMainProps {
  projectName: string
}

const ProjectOverviewMain: FC<ProjectOverviewMainProps> = ({ projectName }) => {
  // FILTERS vvv
  //
  //
  const { filters, setFilters } = useUserFilters({ page: 'overview', projectName })

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
    <Section wrap direction="column">
      <Toolbar style={{ gap: 4 }}>
        <Button icon={'add'} variant="filled">
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
      </Toolbar>
      <NewEditorPage filters={filtersWithHierarchy} />
    </Section>
  )
}

export default ProjectOverviewMain
