import { FeedActivity, useGetActivitiesQuery } from "@shared/api"
import { useMemo } from "react"

type Args = {
  projectName: string
  enabled: boolean
  entityIds: string[]
  activities: FeedActivity[]
  loadingActivities: boolean
  userName: string
}

export function useLastVersionReview({ projectName, enabled, entityIds, activities, loadingActivities, userName }: Args) {
  const existingActivity = useMemo(
    () => activities.find(a => a.activityType === "version.review" && a.authorName === userName),
    [activities, userName]
  )

  const skip = Boolean(entityIds.length === 0 || !enabled || loadingActivities || existingActivity)

  const { data: lastVersionReviewResult } = useGetActivitiesQuery({
    projectName,
    entityIds,
    activityTypes: ["version.review"],
    last: 1,
    authors: [userName],
  }, { skip })


  const lastVersionReview = useMemo(() => {
    return existingActivity ?? lastVersionReviewResult?.activities.at(-1)
  }, [existingActivity, lastVersionReviewResult])

  return lastVersionReview
}
