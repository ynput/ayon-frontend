import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchFilter, Filter, Option, SearchFilterRef } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useGetActivityCategoriesQuery, useGetActivityUsersQuery } from '@shared/api'
import type { QueryFilter } from '@shared/api'
import {
  clientFiltersToFeedFilter,
  feedFilterToClientFilters,
} from '@shared/containers/Feed/helpers/feedFilterAdapter'
import { generateDateOptions } from '@shared/components/SearchFilter/filterDates'
import { useDateRangeFilter, CustomDateRangeDialog } from '@shared/components/SearchFilter'

const Wrapper = styled.div`
  flex: 1;
  min-width: 0;

  /* the filter bar spans the full toolbar width, buttons keep their natural size */
  & > div {
    width: 100%;
    max-width: unset;
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`

interface InboxSearchFilterProps {
  filter: QueryFilter
  onChange: (filter: QueryFilter) => void
  projectName?: string | null
  isLoading?: boolean
}

const InboxSearchFilter = ({
  filter,
  onChange,
  projectName,
  isLoading,
}: InboxSearchFilterProps) => {
  const isDisabled = !projectName

  const { data: users = [] } = useGetActivityUsersQuery(
    { projects: [projectName as string] },
    { skip: isDisabled },
  )
  const { data: categories = [] } = useGetActivityCategoriesQuery(
    { projectName: projectName as string },
    { skip: isDisabled },
  )

  const options: Option[] = useMemo(() => {
    const boolean = (id: string, label: string, icon: string): Option => ({
      id,
      label,
      icon,
      type: 'boolean',
      singleSelect: true,
      values: [],
    })

    return [
      boolean('comments', 'Comments', 'chat'),
      boolean('versions', 'Versions', 'layers'),
      boolean('updates', 'Updates', 'arrow_circle_right'),
      boolean('checklists', 'Checklists', 'check_circle'),
      boolean('has_attachments', 'Attachments', 'attach_file'),
      ...(categories.length
        ? [
            {
              id: 'category',
              label: 'Category',
              icon: 'label',
              type: 'list_of_strings' as const,
              operator: 'OR' as const,
              values: [
                { id: '__none__', label: 'No category', icon: 'crop_square' },
                ...categories.map((c) => ({
                  id: c.name,
                  label: c.name,
                  icon: 'crop_square',
                  color: c.color,
                })),
              ],
            },
          ]
        : []),
      {
        id: 'author',
        label: 'User',
        icon: 'person',
        type: 'list_of_strings' as const,
        operator: 'OR' as const,
        values: users.map((u) => ({
          id: u.name,
          label: u.attrib?.fullName || u.name,
          img: `/api/users/${u.name}/avatar`,
        })),
      },
      {
        id: 'createdAt',
        label: 'Posted date',
        icon: 'calendar_today',
        type: 'datetime',
        values: generateDateOptions(),
      },
    ]
  }, [users, categories])

  const filters = useMemo(() => feedFilterToClientFilters(filter, options), [filter, options])

  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)

  const dateRange = useDateRangeFilter()
  const searchFilterRef = useRef<SearchFilterRef>(null)

  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)])

  const handleFinish = (newFilters: Filter[]) => onChange(clientFiltersToFeedFilter(newFilters))

  const handleFilterChange = (newFilters: Filter[]) =>
    dateRange.wrapFilterChange(newFilters, localFilters, setLocalFilters)

  return (
    <Wrapper
      className={isDisabled || isLoading ? 'disabled' : undefined}
      title={isDisabled ? 'Select a project to search and filter' : undefined}
    >
      <SearchFilter
        ref={searchFilterRef}
        options={options}
        filters={localFilters}
        onChange={handleFilterChange}
        onFinish={handleFinish}
        enableGlobalSearch
        enableMultipleSameFilters={false}
        enableAutosuggestion
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

export default InboxSearchFilter
