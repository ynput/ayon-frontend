import { FC, useEffect, useMemo, useRef, useState } from 'react'
import {
  SearchFilter,
  Filter,
  Option,
  SearchFilterQuickAction,
  SearchFilterRef,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'
import type { QueryFilter, ActivityCategory } from '@shared/api'
import { ActivityUser } from '../helpers/groupMinorActivities'
import { feedFilterToClientFilters, clientFiltersToFeedFilter } from '../helpers/feedFilterAdapter'

const Wrapper = styled.div`
  padding: 4px 8px;

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
}

const FeedSearchFilter: FC<FeedSearchFilterProps> = ({
  feedFilter,
  setFeedFilter,
  users,
  categories,
  supportsReviewSession,
  isLoading,
}) => {
  const searchFilterRef = useRef<SearchFilterRef>(null)

  const options: Option[] = useMemo(() => {
    const opts: Option[] = [
      {
        id: 'comments',
        label: 'Comments',
        icon: 'chat',
        type: 'boolean' as const,
        values: [],
      },
      {
        id: 'versions',
        label: 'Published versions',
        icon: 'layers',
        type: 'boolean' as const,
        values: [],
      },
      {
        id: 'updates',
        label: 'Entity updates',
        icon: 'arrow_circle_right',
        type: 'boolean' as const,
        values: [],
      },
      {
        id: 'checklists',
        label: 'Checklists',
        icon: 'checklist',
        type: 'boolean' as const,
        values: [],
      },
      {
        id: 'has_attachments',
        label: 'Has attachments',
        icon: 'attach_file',
        type: 'boolean' as const,
        values: [],
      },
      ...(supportsReviewSession
        ? [
            {
              id: 'in_review_session',
              label: 'In review session',
              icon: 'subscriptions',
              type: 'boolean' as const,
              values: [],
            },
          ]
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

  const filters = useMemo(() => feedFilterToClientFilters(feedFilter, options), [feedFilter, options])

  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)
  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)])

  const handleFinish = (newFilters: Filter[]) => {
    setFeedFilter(clientFiltersToFeedFilter(newFilters))
  }

  const hasFilter = (key: string) =>
    !!feedFilter.conditions?.some((c) => 'key' in c && c.key === key)

  const quickActions: SearchFilterQuickAction[] = useMemo(
    () => [
      { id: 'checklists', icon: 'checklist', tooltip: 'Checklists', active: hasFilter('checklists') },
      { id: 'author', icon: 'person', tooltip: 'User', active: hasFilter('author') },
    ],
    [feedFilter],
  )

  const handleQuickAction = (id: string) => {
    // checklist is a one-click on/off toggle
    if (id === 'checklists') {
      const conditions = feedFilter.conditions ? [...feedFilter.conditions] : []
      const index = conditions.findIndex((c) => 'key' in c && c.key === 'checklists')
      if (index > -1) conditions.splice(index, 1)
      else conditions.push({ key: 'checklists', operator: 'eq', value: true })
      setFeedFilter({ ...feedFilter, operator: feedFilter.operator || 'and', conditions })
      return
    }
    // user opens the dropdown to pick values, like selecting it from the dropdown
    searchFilterRef.current?.openFilter(id)
  }

  return (
    <Wrapper className={isLoading ? 'loading' : undefined}>
      <SearchFilter
        ref={searchFilterRef}
        options={options}
        filters={localFilters}
        onChange={setLocalFilters}
        onFinish={handleFinish}
        enableGlobalSearch
        enableMultipleSameFilters={false}
        quickActions={quickActions}
        onQuickAction={handleQuickAction}
      />
    </Wrapper>
  )
}

export default FeedSearchFilter
