import React, { useMemo } from 'react'
import * as Styled from './ActivityVersionReview.styled'
import ActivityDate from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import { VersionReviewFeedback } from '../CommentInput/CommentInput'
import { clsx } from 'clsx'
import { UserImage } from '@shared/components'
import { CategoryTag } from '../ActivityCategorySelect'
import { useCategoryData } from '../../hooks/useCategoryData'

interface ActivityVersionReviewProps {
  entityType?: string
  activity: {
    authorName?: string
    authorFullName?: string
    createdAt?: string
    activityData: {
      feedback: VersionReviewFeedback
      category: string
    }
    [key: string]: any
  }
}

export const getVerbForFeedback = (feedback: VersionReviewFeedback) => {
  switch (feedback) {
    case VersionReviewFeedback.REQUEST_CHANGES:
      return "requested changes"
    case VersionReviewFeedback.APPROVE:
    default:
      return "approved this"
  }
}

export const getIconForFeedback = (feedback: VersionReviewFeedback) => {
  switch (feedback) {
    case VersionReviewFeedback.REQUEST_CHANGES:
      return "refresh"
    case VersionReviewFeedback.APPROVE:
    default:
      return "task_alt"
  }
}

const ActivityVersionReview: React.FC<ActivityVersionReviewProps> = ({
  activity = {},
}) => {
  const { authorName, authorFullName, createdAt, activityData } = activity

  const label = useMemo(() => [
    authorFullName || authorName,
    getVerbForFeedback(activityData?.feedback ?? VersionReviewFeedback.APPROVE),
  ].join(' '), [authorFullName, authorName, activityData?.feedback, createdAt])

  const { categoryData, categoryNotFound } = useCategoryData(activityData?.category)

  if (!activityData?.feedback) return

  return (
    <Styled.VersionReview className={clsx(activityData.feedback)}>
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
    </Styled.VersionReview>
  )
}

export default ActivityVersionReview
