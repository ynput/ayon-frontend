import { BuildFilterOptions, useBuildFilterOptions } from '@shared/components'
import { FC, useMemo, useState } from 'react'
import { Filter, Icon, SearchFilter, SearchFilterProps } from '@ynput/ayon-react-components'
import type { ProjectModel } from '@shared/api'
import { EditorTaskNode, TaskNodeMap } from '@shared/containers/ProjectTreeTable'
import AdvancedFiltersPlaceholder from '@components/SearchFilter/AdvancedFiltersPlaceholder'
import { usePowerpack } from '@shared/context'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  queryFilterToClientFilter,
  clientFilterToQueryFilter,
} from '@shared/containers/ProjectTreeTable/utils'

interface SearchFilterWrapperProps
  extends Omit<BuildFilterOptions, 'scope' | 'data' | 'power'>,
    Omit<SearchFilterProps, 'options' | 'onFinish' | 'filters' | 'onChange'> {
  projectInfo?: ProjectModel
  tasksMap?: TaskNodeMap
  scope: BuildFilterOptions['scope']
  queryFilters?: QueryFilter
  onChange?: (queryFilters: QueryFilter) => void
}

const SearchFilterWrapper: FC<SearchFilterWrapperProps> = ({
  queryFilters,
  onChange,
  filterTypes,
  projectNames,
  disabledFilters,
  projectInfo,
  tasksMap,
  scope = 'task',
  config,
  pt,
  ...props
}) => {
  const { columnOrder } = useColumnSettingsContext()

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

  const { setPowerpackDialog, powerLicense } = usePowerpack()
  const handlePowerClick = () => {
    setPowerpackDialog('advancedFilters')
    return false
  }

  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope,
    data,
    columnOrder,
    config: {
      enableExcludes: powerLicense,
      enableOperatorChange: powerLicense,
      enableRelativeValues: true,
      prefixes: { attributes: 'attrib.' },
      ...config,
    },
    power: powerLicense,
  })

  // Convert QueryFilter to Filter[] for internal use
  const _filters = useMemo(() => {
    if (!queryFilters) return []
    return queryFilterToClientFilter(queryFilters, options)
  }, [queryFilters, options])

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>(() => _filters)

  // Use a stable key-based approach to update filters when queryFilters change
  const currentFiltersKey = useMemo(() => {
    return JSON.stringify(queryFilters)
  }, [queryFilters])

  const [lastFiltersKey, setLastFiltersKey] = useState(currentFiltersKey)

  // Only update if the queryFilters actually changed
  if (currentFiltersKey !== lastFiltersKey) {
    const deduplicatedFilters = _filters.filter(
      (filter, index, self) => self.findIndex((f) => f.id === filter.id) === index,
    )
    setFilters(deduplicatedFilters)
    setLastFiltersKey(currentFiltersKey)
  }

  const validateFilters = (filters: Filter[], callback: (filters: Filter[]) => void) => {
    // if a filter is a date then check we have power features
    const invalidFilters = filters.filter((f) => f.type === 'datetime' && !powerLicense)
    const validFilters = filters.filter((f) => f.type !== 'datetime' || powerLicense)
    if (invalidFilters.length) {
      setPowerpackDialog('advancedFilters')
    }

    callback(validFilters)
  }

  const handleFinish = (filters: Filter[]) => {
    validateFilters(filters, (validFilters) => {
      // Convert Filter[] back to QueryFilter and call onChange
      const queryFilter = clientFilterToQueryFilter(validFilters)
      onChange?.(queryFilter)
    })
  }

  const { dropdown, searchBar, ...ptRest } = pt || {}

  return (
    <SearchFilter
      options={options}
      filters={filters}
      onChange={(v) => validateFilters(v, setFilters)} // when filters are changed
      onFinish={handleFinish} // when changes are applied
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
          ...searchBar,
        },
        dropdown: {
          operationsTemplate: powerLicense ? undefined : (
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
              contentAfter: powerLicense ? undefined : <Icon icon="bolt" />,
            },
            hasSomeOption: {
              contentAfter: powerLicense ? undefined : <Icon icon="bolt" />,
            },
          },
          ...dropdown,
        },
        ...ptRest,
      }}
      {...props}
    />
  )
}

export default SearchFilterWrapper
