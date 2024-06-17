import { useSelector } from 'react-redux'
import { onPrefetchIds } from '@state/dashboard'
import { useLazyGetDashboardEntitiesDetailsQuery } from '@/services/userDashboard/getUserDashboard'
import { useLazyGetActivitiesQuery } from '@/services/activities/getActivities'
import { throttle } from 'lodash'
import { activitiesLast } from '@/containers/Feed/Feed'

// prefetch the entity details and activities
export const usePrefetchEntity = (dispatch, projectsInfo, throttleTime) => {
  // keep track of the ids that have been pre-fetched to avoid fetching them again
  const prefetchedIds = useSelector((state) => state.dashboard.prefetchedIds)
  const userName = useSelector((state) => state.user.name)
  const activityTypes = useSelector((state) => state.details.pinned.activityTypes)
  const filter = useSelector((state) => state.details.pinned.filter)

  const setPrefetchedIds = (ids) => dispatch(onPrefetchIds(ids))
  const [getEntitiesDetails] = useLazyGetDashboardEntitiesDetailsQuery()
  const [getEntitiesActivities] = useLazyGetActivitiesQuery()

  const handlePrefetch = ({ id, projectName, entityType = 'task' }) => {
    if (prefetchedIds.includes(id)) return

    setPrefetchedIds([...prefetchedIds, id])

    const entities = [{ id: id, projectName: projectName }]
    const entityIds = [id]
    const projectInfo = projectsInfo[projectName]

    // pre-fetch the entity details
    getEntitiesDetails({ entities: entities, entityType, projectInfo })
    // pre-fetch the activities based on current filter
    getEntitiesActivities({
      entityIds: entityIds,
      projectName: projectName,
      cursor: null,
      last: activitiesLast,
      currentUser: userName,
      referenceTypes: ['origin', 'mention', 'relation'],
      activityTypes: activityTypes,
      filter,
    })
  }

  const throttledPrefetchEntity = throttleTime
    ? throttle(handlePrefetch, throttleTime, { leading: false })
    : handlePrefetch

  return throttledPrefetchEntity
}

export default usePrefetchEntity
