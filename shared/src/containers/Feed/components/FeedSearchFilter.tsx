import { FC, useEffect, useMemo, useState } from 'react'
import { SearchFilter, Filter, Option } from '@ynput/ayon-react-components'
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

const yesValue = [{ id: 'true', label: 'Yes' }]

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
    const boolean = (id: string, label: string, icon: string): Option => ({
      id,
      label,
      icon,
      type: 'boolean',
      singleSelect: true,
      values: yesValue,
    })

    const opts: Option[] = [
      boolean('comments', 'Comments', 'chat'),
      boolean('versions', 'Published versions', 'layers'),
      boolean('updates', 'Entity updates', 'arrow_circle_right'),
      boolean('checklists', 'Checklists', 'checklist'),
      boolean('has_attachments', 'Has attachments', 'attach_file'),
      ...(supportsReviewSession
        ? [boolean('in_review_session', 'In review session', 'subscriptions')]
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
      />
    </Wrapper>
  )
}

export default FeedSearchFilter
