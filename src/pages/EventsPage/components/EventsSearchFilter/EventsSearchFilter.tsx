import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Filter, SearchFilter, SearchFilterRef } from '@ynput/ayon-react-components'
import { useGetUsersQuery, useListProjectsQuery } from '@shared/api'
import { CustomDateRangeDialog, useDateRangeFilter } from '@shared/components/SearchFilter'
import { useEventFacets } from '../../hooks/useEventFacets'
import type { EventFilters, EventItem } from '../../types'
import { isDatePreset } from '../../utils/datePresets'
import {
  buildEventFilterOptions,
  clientFiltersToEventFilters,
  eventFiltersToClientFilters,
} from '../../utils/searchFilter'

const Wrapper = styled.div`
  flex: 1;
  min-width: 240px;

  /* the filter bar spans the free toolbar width */
  & > div {
    width: 100%;
    max-width: unset;
  }
`

interface EventsSearchFilterProps {
  filters: EventFilters
  onChange: (patch: Partial<EventFilters>) => void
  /** loaded events, used for suggestions */
  events: EventItem[]
  entityLabel?: string
}

export const EventsSearchFilter: FC<EventsSearchFilterProps> = ({
  filters,
  onChange,
  events,
  entityLabel,
}) => {
  const isAdmin = useSelector((state: any) => state.user.data.isAdmin)
  const { data: projects = [] } = useListProjectsQuery({})
  const { data: users = [] } = useGetUsersQuery({}) as { data?: { name: string }[] }
  const { counts, categories } = useEventFacets(events, filters.types)

  const topics = useMemo(
    () => [...counts.byTopic.keys()].sort((a, b) => a.localeCompare(b)),
    [counts.byTopic],
  )

  const options = useMemo(
    () =>
      buildEventFilterOptions({
        categories,
        topics,
        projects: projects.map((p) => p.name),
        users: users.map((u) => u.name),
        canFilterByEntity: !!isAdmin,
      }),
    [categories, topics, projects, users, isAdmin],
  )

  const clientFilters = useMemo(
    () => eventFiltersToClientFilters(filters, options, entityLabel),
    [filters, options, entityLabel],
  )

  const [localFilters, setLocalFilters] = useState<Filter[]>(clientFilters)
  const searchFilterRef = useRef<SearchFilterRef>(null)
  const dateRange = useDateRangeFilter()

  useEffect(() => {
    setLocalFilters(clientFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(clientFilters)])

  const handleFinish = (newFilters: Filter[]) => onChange(clientFiltersToEventFilters(newFilters))

  return (
    <Wrapper>
      <SearchFilter
        ref={searchFilterRef}
        options={options}
        filters={localFilters}
        onChange={(newFilters) =>
          dateRange.wrapFilterChange(newFilters, localFilters, setLocalFilters)
        }
        onFinish={handleFinish}
        enableGlobalSearch
        enableMultipleSameFilters={false}
        pt={{
          searchBar: {
            onClickCapture: (e) => {
              // a preset chip edits in the dropdown, only a custom range opens the date dialog
              const date = localFilters.find((f) => f.id === 'date')?.values?.[0]
              if (!isDatePreset(date?.id)) dateRange.handleSearchBarClickCapture(e, localFilters)
            },
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
        header="Date"
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
