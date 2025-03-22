import useBuildFilterOptions, { BuildFilterOptions } from '@hooks/useBuildFilterOptions'
import { FC, useEffect, useMemo, useState } from 'react'
import { Filter, SearchFilter, SearchFilterProps } from '@ynput/ayon-react-components'
import { ProjectModel } from '@api/rest/project'
import { EditorTaskNode, TaskNodeMap } from '@containers/ProjectTreeTable/utils/types'

interface SearchFilterWrapperProps extends Omit<BuildFilterOptions, 'scope' | 'data'> {
  filters: SearchFilterProps['filters']
  onChange: SearchFilterProps['onChange']
  disabledFilters?: string[]
  projectInfo?: ProjectModel
  tasksMap?: TaskNodeMap
}

const SearchFilterWrapper: FC<SearchFilterWrapperProps> = ({
  filters: _filters,
  onChange,
  filterTypes,
  projectNames,
  disabledFilters,
  projectInfo,
  tasksMap,
}) => {
  // create a flat list of all the assignees (string[]) on all tasks (duplicated)
  // this is used to rank what assignees are shown in the filter first
  const allAssignees: string[] = useMemo(
    () =>
      tasksMap
        ? Array.from(tasksMap.values()).flatMap((task: EditorTaskNode) => task.assignees)
        : [],
    [tasksMap],
  )

  // build the data for the suggested options
  const data: BuildFilterOptions['data'] = {
    assignees: allAssignees,
    tags: projectInfo?.tags?.map((t) => t.name) || [],
    // TODO: find a way of getting all attribute values when all tasks are not loaded
  }

  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope: 'task',
    data,
  })

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>(_filters)

  // update filters when it changes
  useEffect(() => {
    setFilters(_filters)
  }, [_filters, setFilters])

  return (
    <SearchFilter
      options={options}
      filters={filters}
      onChange={setFilters}
      onFinish={(v) => onChange(v)} // when changes are applied
      enableMultipleSameFilters={false}
      enableGlobalSearch={true}
      globalSearchConfig={{
        label: 'Folder / Task',
      }}
      disabledFilters={disabledFilters}
    />
  )
}

export default SearchFilterWrapper
