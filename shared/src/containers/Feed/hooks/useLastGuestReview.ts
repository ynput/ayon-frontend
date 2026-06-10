import { FeedActivity, useGetActivitiesQuery } from "@shared/api"
import { useEffect, useMemo } from "react"

type Args = {
  projectName: string
  guestReview: boolean
  entityIds: string[]
  activities: FeedActivity[]
  loadingActivities: boolean
  userName: string
}

export function useLastGuestReview({ projectName, guestReview, entityIds, activities, loadingActivities, userName }: Args) {
  const existingActivity = useMemo(
    () => activities.find(a => a.activityType === "guest_review" && a.authorName === userName),
    [activities, userName]
  )

  const skip = Boolean(entityIds.length === 0 || !guestReview || loadingActivities || existingActivity)

  const { data: lastGuestReviewResult } = useGetActivitiesQuery({
    projectName,
    entityIds,
    activityTypes: ["guest_review"],
    last: 1,
    mine: true,
  }, { skip })


  const lastGuestReview = useMemo(() => {
    return existingActivity ?? lastGuestReviewResult?.activities.at(-1)
  }, [existingActivity, lastGuestReviewResult])

  return lastGuestReview
}
