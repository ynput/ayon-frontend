import { ContextMenuItemConstructor } from '@shared/containers'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { isEntityRestricted } from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'
import { useState } from 'react'

const useReplaceListItem = ({ entityType }: { entityType: string }) => {
  // opens the dialog or not
  const [itemIdsToReplace, setItemIdsToReplace] = useState<null | string[]>(null)

  // build context menu for the item
  const replaceItemContextMenu: ContextMenuItemConstructor = (_e, _item, items) => {
    // Filter out restricted entities from the selection
    const selectedListItems = items
      .filter((cell) => parseCellId(cell.cellId)?.rowId && !isEntityRestricted(cell.entityType))
      .map((cell) => parseCellId(cell.cellId)?.rowId as string)

    if (selectedListItems.length === 0 || !entityType) return undefined

    return {
      icon: 'swap_horiz',
      label: `Replace ${
        selectedListItems.length > 1 ? selectedListItems.length : ''
      } ${entityType}${selectedListItems.length > 1 ? 's' : ''}`,
      command: () => {
        setItemIdsToReplace(selectedListItems)
      },
    }
  }

  return { state: [itemIdsToReplace, setItemIdsToReplace] as const, replaceItemContextMenu }
}

export default useReplaceListItem
