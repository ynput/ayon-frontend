import React, { useMemo } from 'react'
import * as Styled from './ActivityGuestReview.styled'
import ActivityDate from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import { GuestReviewFeedback } from '../CommentInput/CommentInput'
import { clsx } from 'clsx'
import { UserImage } from '@shared/components'
import { CategoryTag } from '../ActivityCategorySelect'
import { useCategoryData } from '../../hooks/useCategoryData'

interface ActivityGuestReviewProps {
  entityType?: string
  activity: {
    authorName?: string
    authorFullName?: string
    createdAt?: string
    activityData: {
      feedback: GuestReviewFeedback
      category: string
    }
    [key: string]: any
  }
}

export const getVerbForFeedback = (feedback: GuestReviewFeedback) => {
  switch (feedback) {
    case GuestReviewFeedback.REQUEST_CHANGES:
      return "requested changes"
    case GuestReviewFeedback.APPROVE:
    default:
      return "approved this"
  }
}

export const getIconForFeedback = (feedback: GuestReviewFeedback) => {
  switch (feedback) {
    case GuestReviewFeedback.REQUEST_CHANGES:
      return "refresh"
    case GuestReviewFeedback.APPROVE:
    default:
      return "task_alt"
  }
}

const ActivityGuestReview: React.FC<ActivityGuestReviewProps> = ({
  activity = {},
}) => {
  const { authorName, authorFullName, createdAt, activityData } = activity

  const label = useMemo(() => [
    authorFullName || authorName,
    getVerbForFeedback(activityData?.feedback ?? GuestReviewFeedback.APPROVE),
  ].join(' '), [authorFullName, authorName, activityData?.feedback, createdAt])

  const { categoryData, categoryNotFound } = useCategoryData(activityData?.category)

  if (!activityData?.feedback) return

  return (
    <Styled.GuestReview className={clsx(activityData.feedback)}>
      <Styled.Body>
        {authorName && <UserImage name={authorName} size={22} />}
        <Icon icon={getIconForFeedback(activityData.feedback)} />
        {
          categoryData && (
            <CategoryTag
              value={categoryData.name}
              color={categoryData.color}
              style={{
                top: -4,
                left: -4,
              }}
              isCompact
              data-tooltip={
                categoryNotFound ? 'Category not found. It may have been deleted.' : undefined
              }
              data-tooltip-delay={0}
            />
          )
        }
        {label}
        <ActivityDate date={createdAt} />
      </Styled.Body>
    </Styled.GuestReview>
  )
}

export default ActivityGuestReview
