import { useCallback } from 'react'
import { useSlotMenuItems } from '@ynput/ayon-addon'
import type { MenuKind } from '@ynput/ayon-addon'
import { useProjectContext } from '@shared/context'
import { useListsContext } from '../context/lists'

/**
 * Items addons contribute to the lists panel's menus (lists.menuItem slot, @ynput/ayon-addon):
 * returns a function that builds them for the selected lists and the menu they go in, the ones that
 * list this menu (`in`) and this page's list type (`entityListTypes`). The slot's example, for Show
 * slots, also shows without a selected list.
 */
const useListsSlotItems = () => {
  const { projectName } = useProjectContext()
  const { isReview } = useListsContext()
  const buildSlotItems = useSlotMenuItems('lists.menuItem')
  const entityListType = isReview ? 'review-session' : 'generic'

  return useCallback(
    (listIds: string[], menu: MenuKind) =>
      buildSlotItems(
        { projectName, listIds, entityListType, menu },
        (item) =>
          !!listIds.length &&
          (!item.in?.length || item.in.includes(menu)) &&
          (!item.entityListTypes?.length || item.entityListTypes.includes(entityListType)),
      ),
    [buildSlotItems, projectName, entityListType],
  )
}

export default useListsSlotItems
