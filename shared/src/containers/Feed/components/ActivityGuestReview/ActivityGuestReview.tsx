import React, { useMemo } from 'react'
import * as Styled from './ActivityGuestReview.styled'
import ActivityDate, { getFuzzyDate } from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import { GuestReviewFeedback } from '../CommentInput/CommentInput'
import { clsx } from 'clsx'
import { UserImage } from '@shared/components'

interface ActivityGuestReviewProps {
  entityType?: string
  activity: {
    authorName?: string
    authorFullName?: string
    createdAt?: string
    activityData: {
      feedback: GuestReviewFeedback
    }
    [key: string]: any
  }
}

const getVerbForFeedback = (feedback: GuestReviewFeedback) => {
  switch (feedback) {
    case GuestReviewFeedback.REQUEST_CHANGES:
      return "requested changes"
    case GuestReviewFeedback.APPROVE:
    default:
      return "approved this"
  }
}

const getIconForFeedback = (feedback: GuestReviewFeedback) => {
  switch (feedback) {
    case GuestReviewFeedback.REQUEST_CHANGES:
      return "sync"
    case GuestReviewFeedback.APPROVE:
    default:
      return "task_alt"
  }
}

const ActivityGuestReview: React.FC<ActivityGuestReviewProps> = ({
  activity = {},
}) => {
  const { authorName, authorFullName, createdAt, activityData } = activity
  if (!activityData?.feedback) return

  const label = useMemo(() => [
    authorFullName || authorName,
    getVerbForFeedback(activityData.feedback),
  ].join(' '), [authorFullName, authorName, activityData.feedback, createdAt])

  return (
    <Styled.GuestReview className={clsx(activityData.feedback)}>
      <Styled.Body>
        <UserImage name={authorName} size={22} />
        <Icon icon={getIconForFeedback(activityData.feedback)} />
        {label}
        <ActivityDate date={createdAt} />
      </Styled.Body>
    </Styled.GuestReview>
  )
}

export default ActivityGuestReview
