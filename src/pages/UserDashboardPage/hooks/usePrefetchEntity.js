import { useSelector } from 'react-redux'
import { onPrefetchIds } from '@state/dashboard'
import { useLazyGetEntitiesDetailsPanelQuery } from '@queries/entity/getEntityPanel'
import { getActivitiesGQLApi } from '@queries/activities/getActivities'
import { throttle } from 'lodash'
import { activitiesLast } from '@containers/Feed/Feed'

// prefetch the entity details and activities
export const usePrefetchEntity = (dispatch, projectsInfo, throttleTime, scope) => {
  // keep track of the ids that have been pre-fetched to avoid fetching them again
  const prefetchedIds = useSelector((state) => state.dashboard.prefetchedIds)
  const userName = useSelector((state) => state.user.name)
  const activityTypes = useSelector((state) => state.details.pinned[scope].activityTypes)
  const filter = useSelector((state) => state.details.pinned[scope].filter)

  const setPrefetchedIds = (ids) => dispatch(onPrefetchIds(ids))
  const [getEntitiesDetails] = useLazyGetEntitiesDetailsPanelQuery()

  const handlePrefetch = ({ id, projectName, entityType = 'task' }) => {
    if (prefetchedIds.includes(id)) return

    setPrefetchedIds([...prefetchedIds, id])

    const entities = [{ id: id, projectName: projectName }]
    const entityIds = [id]

    // pre-fetch the entity details
    getEntitiesDetails({ entities: entities, entityType, projectsInfo })
  }

  const throttledPrefetchEntity = throttleTime
    ? throttle(handlePrefetch, throttleTime, { leading: false })
    : handlePrefetch

  return throttledPrefetchEntity
}

export default usePrefetchEntity
