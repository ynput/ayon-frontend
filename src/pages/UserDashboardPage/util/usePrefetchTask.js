import { useSelector } from 'react-redux'
import { onPrefetchIds } from '/src/features/dashboard'
import { useLazyGetDashboardEntitiesDetailsQuery } from '/src/services/userDashboard/getUserDashboard'

export const usePrefetchTask = (dispatch) => {
  // keep track of the ids that have been pre-fetched to avoid fetching them again
  const prefetchedIds = useSelector((state) => state.dashboard.prefetchedIds)
  const setPrefetchedIds = (ids) => dispatch(onPrefetchIds(ids))
  const [getEntitiesDetails] = useLazyGetDashboardEntitiesDetailsQuery()

  const handlePrefetch = (task) => {
    if (prefetchedIds.includes(task.id)) return

    setPrefetchedIds([...prefetchedIds, task.id])

    const entities = [{ id: task.id, projectName: task.projectName }]

    // pre-fetch the task details
    getEntitiesDetails({ entities: entities })
  }
  return handlePrefetch
}

export default usePrefetchTask
