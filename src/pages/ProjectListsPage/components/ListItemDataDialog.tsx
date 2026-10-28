import { DetailsDialog } from '@shared/components'
import { useListItemsDataContext } from '../context/list-items-data'

const ListItemDataDialog = () => {
  const { viewListItemDataState, listItemsMap } = useListItemsDataContext()
  const [listItemId, setListItemId] = viewListItemDataState
  const listItem = listItemId ? listItemsMap.get(listItemId) : undefined

  if (!listItem) return null

  // the list item's own fields first, then the entity's data
  const { id, entityId, entityType, position, ...entityData } = listItem

  return (
    <DetailsDialog
      entityType={entityType}
      entityIds={[entityId]}
      data={{ id, entityId, entityType, position, ...entityData }}
      header="List item data"
      visible
      onHide={() => setListItemId(null)}
    />
  )
}

export default ListItemDataDialog
