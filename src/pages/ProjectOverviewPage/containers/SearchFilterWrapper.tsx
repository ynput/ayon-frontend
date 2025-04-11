import useBuildFilterOptions, { BuildFilterOptions } from '@hooks/useBuildFilterOptions'
import { FC, useEffect, useMemo, useState } from 'react'
import { Filter, Icon, SearchFilter, SearchFilterProps } from '@ynput/ayon-react-components'
import { ProjectModel } from '@api/rest/project'
import { EditorTaskNode, TaskNodeMap } from '@shared/ProjectTreeTable/utils/types'
import { usePower } from '@/remote/context/PowerLicenseContext'
import AdvancedFiltersPlaceholder from '@components/SearchFilter/AdvancedFiltersPlaceholder'
import { usePowerpack } from '@context/powerpackContext'
import { useColumnSettings } from '@shared/ProjectTreeTable'

interface SearchFilterWrapperProps extends Omit<BuildFilterOptions, 'scope' | 'data' | 'power'> {
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
  const { columnOrder } = useColumnSettings()

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

  const { setPowerpackDialog } = usePowerpack()
  const handlePowerClick = () => {
    setPowerpackDialog('advancedFilters')
    return false
  }
  const power = usePower()

  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope: 'task',
    data,
    columnOrder,
    config: { enableExcludes: power, enableOperatorChange: power, enableRelativeValues: true },
    power,
  })

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>(_filters)

  // update filters when it changes
  useEffect(() => {
    setFilters(
      _filters.filter((filter, index, self) => self.findIndex((f) => f.id === filter.id) === index),
    )
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
      pt={{
        searchBar: {
          style: {
            paddingRight: 28,
          },
        },
        dropdown: {
          operationsTemplate: power ? undefined : (
            <AdvancedFiltersPlaceholder onClick={handlePowerClick} />
          ),
          pt: {
            item: {
              onClick: (event) => {
                const listItem = (event.target as HTMLLIElement).closest('li')
                if (listItem?.querySelector('span[icon="bolt"]')) {
                  return handlePowerClick()
                } else return true
              },
            },
            hasNoOption: {
              contentAfter: power ? undefined : <Icon icon="bolt" />,
            },
            hasSomeOption: {
              contentAfter: power ? undefined : <Icon icon="bolt" />,
            },
          },
        },
      }}
    />
  )
}

export default SearchFilterWrapper
