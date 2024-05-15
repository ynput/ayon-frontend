import { useSelector } from 'react-redux'
import { onPrefetchIds } from '/src/features/dashboard'
import { useLazyGetDashboardEntitiesDetailsQuery } from '/src/services/userDashboard/getUserDashboard'
import { useLazyGetActivitiesQuery } from '/src/services/activities/getActivities'
import { throttle } from 'lodash'

export const usePrefetchTask = (dispatch, projectsInfo, throttleTime) => {
  // keep track of the ids that have been pre-fetched to avoid fetching them again
  const prefetchedIds = useSelector((state) => state.dashboard.prefetchedIds)
  const userName = useSelector((state) => state.user.name)
  const activityTypes = useSelector((state) => state.details.pinned.activityTypes)
  const filter = useSelector((state) => state.details.pinned.filter)

  const setPrefetchedIds = (ids) => dispatch(onPrefetchIds(ids))
  const [getEntitiesDetails] = useLazyGetDashboardEntitiesDetailsQuery()
  const [getEntitiesActivities] = useLazyGetActivitiesQuery()

  const handlePrefetch = (task) => {
    if (prefetchedIds.includes(task.id)) return

    setPrefetchedIds([...prefetchedIds, task.id])

    const entities = [{ id: task.id, projectName: task.projectName }]
    const entityIds = [task.id]
    const projectInfo = projectsInfo[task.projectName]

    // pre-fetch the task details
    getEntitiesDetails({ entities: entities, entityType: 'task', projectInfo })
    // pre-fetch the activities based on current filter
    getEntitiesActivities({
      entityIds: entityIds,
      projectName: task.projectName,
      cursor: null,
      last: 20,
      currentUser: userName,
      referenceTypes: ['origin', 'mention', 'relation'],
      activityTypes: activityTypes,
      filter,
    })
  }

  const throttledPrefetchTask = throttleTime
    ? throttle(handlePrefetch, throttleTime, { leading: false })
    : handlePrefetch

  return throttledPrefetchTask
}

export default usePrefetchTask
