import { useMemo } from 'react'

const useTransformActivities = (activities = [], projectsInfo = {}) => {
  const transformedActivitiesData = useMemo(() => {
    return activities.map((activity) => {
      const newActivity = { ...activity }
      if (newActivity.activityType === 'status.change') {
        const projectInfo = projectsInfo[newActivity.projectName]
        if (!projectInfo) return newActivity
        const oldStatusName = newActivity.activityData?.oldValue
        const newStatusName = newActivity.activityData?.newValue

        const oldStatus = projectInfo.statuses.find((status) => status.name === oldStatusName)
        const newStatus = projectInfo.statuses.find((status) => status.name === newStatusName)

        newActivity.oldStatus = { ...oldStatus, name: oldStatusName }
        newActivity.newStatus = { ...newStatus, name: newStatusName }
      }
      return newActivity
    })
  }, [activities])

  // sort reversed activities data
  const reversedActivitiesData = useMemo(
    () => transformedActivitiesData.slice().reverse(),
    [transformedActivitiesData],
  )

  return reversedActivitiesData
}

export default useTransformActivities
