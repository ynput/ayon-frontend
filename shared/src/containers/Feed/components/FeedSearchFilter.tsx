import { FC, useEffect, useMemo, useState } from 'react'
import { SearchFilter, Filter, Option, SearchFilterQuickAction } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import type { QueryFilter, ActivityCategory } from '@shared/api'
import { ActivityUser } from '../helpers/groupMinorActivities'
import {
  feedFilterToClientFilters,
  clientFiltersToFeedFilter,
  FEED_QUICK_ACTION_KEYS,
} from '../helpers/feedFilterAdapter'

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
  const options: Option[] = useMemo(() => {
    const opts: Option[] = [
      {
        id: 'author',
        label: 'User',
        type: 'list_of_strings',
        icon: 'person',
        operator: 'OR',
        values: users.map((u) => ({
          id: u.name,
          label: u.attrib?.fullName || u.name,
          img: `/api/users/${u.name}/avatar`,
        })),
      },
    ]

    if (categories.length) {
      opts.push({
        id: 'category',
        label: 'Category',
        type: 'list_of_strings',
        icon: 'label',
        operator: 'OR',
        values: [
          { id: '__none__', label: 'No category', icon: 'crop_square' },
          ...categories.map((c) => ({
            id: c.name,
            label: c.name,
            icon: 'crop_square',
            color: c.color,
          })),
        ],
      })
    }

    return opts
  }, [users, categories])

  const filters = useMemo(() => feedFilterToClientFilters(feedFilter, options), [feedFilter, options])

  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)
  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)])

  const handleFinish = (newFilters: Filter[]) => {
    setFeedFilter(clientFiltersToFeedFilter(newFilters, feedFilter))
  }

  const isQuickActive = (id: string) =>
    !!feedFilter.conditions?.some((c) => 'key' in c && c.key === id && c.value === true)

  const quickActions: SearchFilterQuickAction[] = useMemo(
    () =>
      [
        { id: 'comments', icon: 'chat', tooltip: 'Comments' },
        { id: 'checklists', icon: 'checklist', tooltip: 'Checklists' },
        { id: 'versions', icon: 'layers', tooltip: 'Published versions' },
        { id: 'updates', icon: 'arrow_circle_right', tooltip: 'Entity updates' },
        { id: 'has_attachments', icon: 'attach_file', tooltip: 'Has attachments' },
        ...(supportsReviewSession
          ? [{ id: 'in_review_session', icon: 'subscriptions', tooltip: 'In review session' }]
          : []),
      ].map((a) => ({ ...a, active: isQuickActive(a.id) })),
    [feedFilter, supportsReviewSession],
  )

  const handleQuickAction = (id: string) => {
    if (!FEED_QUICK_ACTION_KEYS.includes(id)) return
    const conditions = feedFilter.conditions ? [...feedFilter.conditions] : []
    const index = conditions.findIndex((c) => 'key' in c && c.key === id)
    if (index > -1) conditions.splice(index, 1)
    else conditions.push({ key: id, operator: 'eq', value: true })
    setFeedFilter({ ...feedFilter, operator: feedFilter.operator || 'and', conditions })
  }

  return (
    <Wrapper className={isLoading ? 'loading' : undefined}>
      <SearchFilter
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
