import { isEqual } from 'lodash'
import { useSelector } from 'react-redux'

const subscribedStateFields = ['versions', 'products', 'folders', 'tasks']

function useFocusedEntities(projectName, focusType) {
  function getFirstEntityType(entityIds) {
    for (const entityId of entityIds) {
      for (const type of subscribedStateFields) {
        if (focused[type].includes(entityId)) {
          return type.slice(0, -1)
        }
      }
    }
  }

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

  const entityIds = (focusType !== undefined ? focused[focusType] : focused[entityType + 's']) || []
  if (focusType === 'editor') {
    entityType = getFirstEntityType(entityIds)
  }

  const entities = entityIds.map((id) => ({ id, projectName }))

  return { entities, entityType, subTypes }
}

export default useFocusedEntities
