import { useEffect, useMemo, useState } from "react"

import * as Styled from './CommentInput.styled'
import { getFuzzyDate, REFRESH_INTERVAL_MS } from "../ActivityDate"
import { Icon } from "@ynput/ayon-react-components"
import { getIconForFeedback, getVerbForFeedback } from "../ActivityGuestReview/ActivityGuestReview"
import { FeedActivity } from "@shared/api"
import { clsx } from "clsx"

type Props = {
  separate: boolean
  lastGuestReview: FeedActivity
}

export const GuestReviewPill = ({ separate, lastGuestReview }: Props) => {
  // used to update the time since last guest review
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(
      () => setNow(new Date()),
      REFRESH_INTERVAL_MS,
    )

    return () => clearInterval(interval)
  }, [])

  const lastGuestReviewFeedback = useMemo(() => {
    return lastGuestReview?.activityData?.feedback
  }, [lastGuestReview])

  const lastGuestReviewDate = useMemo(
    () => {
      if (!lastGuestReview?.createdAt) return ""
      return getFuzzyDate(new Date(lastGuestReview?.createdAt)).toLowerCase()
    },
    [lastGuestReview?.createdAt, now],
  )

  return (
    <Styled.LastGuestReview className={clsx(lastGuestReviewFeedback, separate ? "separate" : "")}>
      <Icon icon={getIconForFeedback(lastGuestReviewFeedback)} />
      You last {
        getVerbForFeedback(lastGuestReviewFeedback)
      } {
        lastGuestReviewDate
      } {lastGuestReviewDate === "just now" ? "" : "ago"}
    </Styled.LastGuestReview>
  )
}
