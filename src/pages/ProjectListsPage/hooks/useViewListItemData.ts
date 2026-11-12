import { ContextMenuItemConstructor } from '@shared/containers'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { useState } from 'react'

// "View data" on right click: shows the list item's data, including its id
const useViewListItemData = () => {
  const [listItemId, setListItemId] = useState<null | string>(null)

  const viewDataContextMenu: ContextMenuItemConstructor = (_e, cell, _selected, meta) => {
    const rowId = parseCellId(cell.cellId)?.rowId
    return {
      icon: 'database',
      label: 'View data',
      command: () => rowId && setListItemId(rowId),
      hidden: !rowId || cell.isGroup || meta.selectedRows.length > 1,
    }
  }

  return { state: [listItemId, setListItemId] as const, viewDataContextMenu }
}

export default useViewListItemData
