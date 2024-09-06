import { isEqual } from "lodash"
import { useSelector } from "react-redux"

function useFocusedEntities(projectName) {
  const subscribedStateFields = ['versions', 'products', 'folders', 'tasks']

  const focused = useSelector(
    (state) => state.context.focused,
    (a, b) => {
      // compare subscribed states and if any are different, return false
      for (const field of subscribedStateFields) {
        if (!isEqual(a[field], b[field])) return false
      }

      return true
    },
  )

  let { type: entityType, subTypes } = focused
  // if entityType is representation, entityType stays as versions because we use a slide out
  if (entityType === 'representation') {
    entityType = 'version'
  }
  const entityIds = focused[entityType + 's'] || []
  const entities = entityIds.map((id) => ({ id, projectName }))

  return {entities, entityType, subTypes}
}

export default useFocusedEntities
