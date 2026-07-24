import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import {
  SearchFilter,
  Filter,
  Option,
  SearchFilterQuickAction,
  SearchFilterRef,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { type QueryFilter, type ActivityCategory, ChecklistCount } from '@shared/api'
import { ActivityUser } from '../helpers/groupMinorActivities'
import { feedFilterToClientFilters, clientFiltersToFeedFilter } from '../helpers/feedFilterAdapter'
import { generateDateOptions } from '@shared/components/SearchFilter/filterDates'
import { useDateRangeFilter, CustomDateRangeDialog } from '@shared/components/SearchFilter'

const Wrapper = styled.div`
  padding: 4px 8px;
  padding-bottom: 0;
  filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.25));
  z-index: 10;

  position: absolute;
  top: 0;
  left: 0;
  right: 0;

  &.loading {
    opacity: 0.5;
    pointer-events: none;
  }
`

interface FeedSearchFilterProps {
  feedFilter: QueryFilter
  setFeedFilter: (filter: QueryFilter) => void
  users: ActivityUser[]
  categories: ActivityCategory[]
  supportsReviewSession: boolean
  isLoading?: boolean
  checklistCount?: ChecklistCount | undefined
  onSearchTextChange?: (text: string) => void
}

const FeedSearchFilter = forwardRef<SearchFilterRef, FeedSearchFilterProps>(
  ({
    feedFilter,
    setFeedFilter,
    users,
    categories,
    supportsReviewSession,
    isLoading,
    checklistCount,
    onSearchTextChange,
  }) => {
    const options: Option[] = useMemo(() => {
      // no values -> ARC adds it in one click (select "Yes"), no value-panel prompt
      const boolean = (id: string, label: string, icon: string): Option => ({
        id,
        label,
        icon,
        type: 'boolean',
        singleSelect: true,
        values: [],
      })

      const opts: Option[] = [
        boolean('comments', 'Comments', 'chat'),
        boolean('versions', 'Versions', 'layers'),
        boolean('updates', 'Updates', 'arrow_circle_right'),
        boolean('checklists', 'Checklists', 'check_circle'),
        boolean('has_attachments', 'Attachments', 'attach_file'),
        ...(supportsReviewSession
          ? [boolean('in_review_session', 'Review session', 'subscriptions')]
          : []),
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

      return opts
    }, [users, categories, supportsReviewSession])

    let checklistsLabel: string = ''
    if (checklistCount?.total && checklistCount.total > 0) {
      checklistsLabel = `${checklistCount.checked}/${checklistCount.total}`
    }

    // @ts-expect-error - using string is fine
    const quickActions: SearchFilterQuickAction[] = useMemo(
      () => ['comments', { id: 'checklists', label: checklistsLabel, tooltip: 'Checklists' }],
      [checklistsLabel],
    )

    const filters = useMemo(
      () => feedFilterToClientFilters(feedFilter, options),
      [feedFilter, options],
    )

    const [localFilters, setLocalFilters] = useState<Filter[]>(filters)

    const dateRange = useDateRangeFilter()

    const searchFilterRef = useRef<SearchFilterRef>(null)

    useEffect(() => {
      setLocalFilters(filters)
    }, [JSON.stringify(filters)])

    // close the search filter when clicking outside of it
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const filterContainer = searchFilterRef.current?.getContainerElement()
        // if the click is outside the search filter container, close it
        if (filterContainer && !filterContainer.contains(event.target as Node)) {
          searchFilterRef.current?.close()
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [searchFilterRef])

    const handleFinish = (newFilters: Filter[]) => {
      setFeedFilter(clientFiltersToFeedFilter(newFilters))
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
          placeholder="Search and filter feed..."
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
  },
)

FeedSearchFilter.displayName = 'FeedSearchFilter'

export default FeedSearchFilter
