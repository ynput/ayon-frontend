import { useSelector } from 'react-redux'
import { onPrefetchIds } from '/src/features/dashboard'
import { useLazyGetDashboardEntitiesDetailsQuery } from '/src/services/userDashboard/getUserDashboard'
import { useLazyGetActivitiesQuery } from '/src/services/activities/getActivities'
import { throttle } from 'lodash'
import { activitiesLast } from '/src/containers/Feed/Feed'

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

  const handlePrefetch = (entity) => {
    if (prefetchedIds.includes(entity.id)) return

    setPrefetchedIds([...prefetchedIds, entity.id])

    const entities = [{ id: entity.id, projectName: entity.projectName }]
    const entityIds = [entity.id]
    const projectInfo = projectsInfo[entity.projectName]

    // pre-fetch the entity details
    getEntitiesDetails({ entities: entities, entityType: 'entity', projectInfo })
    // pre-fetch the activities based on current filter
    getEntitiesActivities({
      entityIds: entityIds,
      projectName: entity.projectName,
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
