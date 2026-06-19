import { FC, useEffect, useMemo, useRef, useState } from 'react'
import {
  SearchFilter,
  Filter,
  Option,
  SearchFilterQuickAction,
  SearchFilterRef,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { type QueryFilter, UserModel } from '@shared/api'
import {
  subtasksFilterToClientFilters,
  clientFiltersToSubtasksFilter,
} from '../../helpers/subtasksFilterAdapter'
import { generateDateOptions } from '@shared/components/SearchFilter/filterDates'
import { useDateRangeFilter } from '@shared/components/SearchFilter/useDateRangeFilter'
import { CustomDateRangeDialog } from '@shared/components/SearchFilter/CustomDateRangeDialog'

const Wrapper = styled.div`
  padding: 4px 8px;
  padding-bottom: 0;

  &.loading {
    opacity: 0.5;
    pointer-events: none;
  }
`

interface SubtasksSearchFilterProps {
  subtasksFilter: QueryFilter
  setSubtasksFilter: (filter: QueryFilter) => void
  users: UserModel[]
  isLoading?: boolean
  totalCount?: number
  doneCount?: number
  onSearchTextChange?: (text: string) => void
}

const SubtasksSearchFilter: FC<SubtasksSearchFilterProps> = ({
  subtasksFilter,
  setSubtasksFilter,
  users,
  isLoading,
  totalCount = 0,
  doneCount = 0,
  onSearchTextChange,
}) => {
  const options: Option[] = useMemo(
    () => [
      {
        id: 'isDone',
        label: 'Status',
        icon: 'check_circle',
        type: 'boolean',
        singleSelect: true,
        values: [
          { id: 'false', label: 'Not Done', icon: 'radio_button_unchecked' },
          { id: 'true', label: 'Done', icon: 'check_circle' },
        ],
      },
      {
        id: 'assignees',
        label: 'Assignees',
        icon: 'person',
        type: 'list_of_strings' as const,
        operator: 'OR' as const,
        allowHasValue: true,
        allowNoValue: true,
        values: users.map((u) => ({
          id: u.name,
          label: u.attrib?.fullName || u.name,
          img: `/api/users/${u.name}/avatar`,
        })),
      },
      //   dates disabled until planner update with support is released
      //   {
      //     id: 'startDate',
      //     label: 'Start Date',
      //     icon: 'calendar_today',
      //     type: 'datetime',
      //     values: generateDateOptions(),
      //   },
      //   {
      //     id: 'endDate',
      //     label: 'End Date',
      //     icon: 'event',
      //     type: 'datetime',
      //     values: generateDateOptions(),
      //   },
    ],
    [users],
  )

  const filters = useMemo(() => {
    return subtasksFilterToClientFilters(subtasksFilter, options)
  }, [subtasksFilter, options])

  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)
  const searchFilterRef = useRef<SearchFilterRef>(null)

  const dateRange = useDateRangeFilter()

  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)])

  const handleFinish = (newFilters: Filter[]) => {
    const queryFilter = clientFiltersToSubtasksFilter(newFilters)

    setSubtasksFilter(queryFilter)
    onSearchTextChange?.('')
  }

  const handleFilterChange = (newFilters: Filter[]) => {
    dateRange.wrapFilterChange(newFilters, localFilters, setLocalFilters)
  }

  const handleLiveSearch = (value: string, filter: string | null) => {
    // only for root level searching
    if (!!filter) return
    onSearchTextChange?.(value)
  }

  let statusLabel: string = ''
  if (totalCount > 0) {
    statusLabel = `${doneCount}/${totalCount}`
  }

  const quickActions: SearchFilterQuickAction[] = useMemo(
    () => [{ id: 'isDone', label: statusLabel, tooltip: 'Status' }],
    [statusLabel],
  )

  return (
    <Wrapper className={isLoading ? 'loading' : undefined}>
      <SearchFilter
        ref={searchFilterRef}
        compact
        options={options}
        filters={localFilters}
        onChange={handleFilterChange}
        onFinish={handleFinish}
        enableGlobalSearch
        enableMultipleSameFilters={false}
        enableAutosuggestion={true}
        onSearchChange={handleLiveSearch}
        quickActions={quickActions}
        placeholder="Search and filter subtasks..."
        pt={{
          searchBar: {
            onClickCapture: (e) => dateRange.handleSearchBarClickCapture(e, localFilters),
          },
          dropdown: {
            pt: {
              item: {
                onClick: (e) => dateRange.handleDropdownItemClick(e, localFilters, options),
              },
            },
          },
        }}
      />
      <CustomDateRangeDialog
        isOpen={!!dateRange.customRangeFilterId}
        header={
          options.find((o) => o.id === dateRange.customRangeFilterId?.split('__')[0])?.label ??
          'Custom range'
        }
        startDate={dateRange.customStartDate}
        endDate={dateRange.customEndDate}
        onStartDateChange={dateRange.setCustomStartDate}
        onEndDateChange={dateRange.setCustomEndDate}
        onApply={() =>
          dateRange.handleCustomRangeApply(localFilters, options, handleFinish, searchFilterRef)
        }
        onClose={dateRange.handleCustomRangeClose}
      />
    </Wrapper>
  )
}

export default SubtasksSearchFilter
