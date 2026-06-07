import { FC, useEffect, useMemo, useState } from 'react'
import { SearchFilter, Filter, Option, SearchFilterQuickAction } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { type QueryFilter, type ActivityCategory, ChecklistCount } from '@shared/api'
import { ActivityUser } from '../helpers/groupMinorActivities'
import { feedFilterToClientFilters, clientFiltersToFeedFilter } from '../helpers/feedFilterAdapter'

const Wrapper = styled.div`
  padding: 4px 8px;
  padding-bottom: 0;
  /* filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.25)); */
  /* z-index: 1; */

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

const FeedSearchFilter: FC<FeedSearchFilterProps> = ({
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
  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)])

  const handleFinish = (newFilters: Filter[]) => {
    setFeedFilter(clientFiltersToFeedFilter(newFilters))
    onSearchTextChange?.('')
  }

  const handleLiveSearch = (value: string, filter: string | null) => {
    // only for root level searching
    if (!!filter) return
    onSearchTextChange?.(value)
  }

  return (
    <Wrapper className={isLoading ? 'loading' : undefined}>
      <SearchFilter
        compact
        options={options}
        filters={localFilters}
        onChange={setLocalFilters}
        onFinish={handleFinish}
        enableGlobalSearch
        enableMultipleSameFilters={false}
        enableAutosuggestion={true}
        onSearchChange={handleLiveSearch}
        quickActions={quickActions}
      />
    </Wrapper>
  )
}

export default FeedSearchFilter
