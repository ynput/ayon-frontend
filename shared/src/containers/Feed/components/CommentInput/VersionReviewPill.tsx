import { useEffect, useMemo, useState } from 'react'

import * as Styled from './CommentInput.styled'
import { getFuzzyDate, REFRESH_INTERVAL_MS } from '../ActivityDate'
import { Icon } from '@ynput/ayon-react-components'
import {
  getIconForFeedback,
  getVerbForFeedback,
} from '../ActivityVersionReview/ActivityVersionReview'
import { FeedActivity } from '@shared/api'
import { clsx } from 'clsx'

type Props = {
  lastOwnVersionReview: FeedActivity
}

export const VersionReviewPill = ({ lastOwnVersionReview }: Props) => {
  // used to update the time since last guest review
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const lastOwnVersionReviewFeedback = useMemo(() => {
    return lastOwnVersionReview?.activityData?.feedback
  }, [lastOwnVersionReview])

  const lastOwnVersionReviewDate = useMemo(() => {
    if (!lastOwnVersionReview?.createdAt) return ''
    return getFuzzyDate(new Date(lastOwnVersionReview?.createdAt)).toLowerCase()
  }, [lastOwnVersionReview?.createdAt, now])

  return (
    <Styled.LastOwnVersionReview className={clsx(lastOwnVersionReviewFeedback)}>
      <Icon icon={getIconForFeedback(lastOwnVersionReviewFeedback)} />
      You last {getVerbForFeedback(lastOwnVersionReviewFeedback)} {lastOwnVersionReviewDate}{' '}
      {lastOwnVersionReviewDate === 'just now' ? '' : 'ago'}
    </Styled.LastOwnVersionReview>
  )
}
