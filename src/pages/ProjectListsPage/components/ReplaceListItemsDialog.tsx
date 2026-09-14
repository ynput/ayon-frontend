import { FC, useMemo, useState, useCallback } from 'react'
import { EntityPickerDialog, PickerEntityType } from '@shared/containers'
import { useProjectContext } from '@shared/context'
import { useListsContext } from '../context'
import { useListItemsDataContext } from '../context/ListItemsDataContext'
import { useUpdateEntityListItemsMutation } from '@shared/api'
import { toast } from 'react-toastify'

const ReplaceListItemsDialog: FC = () => {
  const { projectName } = useProjectContext()
  const { selectedList } = useListsContext()
  const { replaceListItemsState, listItemsMap } = useListItemsDataContext()
  const entityType = selectedList?.entityType as PickerEntityType

  const [itemIdsToReplace, setItemIdsToReplace] = replaceListItemsState

  const [updateEntityListItems] = useUpdateEntityListItemsMutation()
  const [isReplacing, setIsReplacing] = useState(false)

  const replaceListItems = useCallback(
    async (newEntityIds: string[]) => {
      if (!itemIdsToReplace || !selectedList?.id || !listItemsMap) return
      setIsReplacing(true)

      const itemsToReplace = itemIdsToReplace
        .map((id) => listItemsMap.get(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))

      // calculate the position for the new items based on the first item to replace
      const firstItem = itemsToReplace[0]
      const position = firstItem?.position || 1

      try {
        await updateEntityListItems({
          projectName,
          listId: selectedList.id,
          entityListMultiPatchModel: {
            // @ts-ignore
            items: [
              ...itemIdsToReplace.map((id) => ({ id, entityId: null })),
              ...newEntityIds.map((entityId) => ({ entityId, position })),
            ],
            mode: 'merge',
          },
        }).unwrap()

        toast.success(`Items replaced successfully`)
        setItemIdsToReplace(null)
      } catch (error) {
        console.error('Error replacing items:', error)
        toast.error(`Error replacing items: ${error}`)
      } finally {
        setIsReplacing(false)
      }
    },
    [projectName, selectedList?.id, itemIdsToReplace, updateEntityListItems, setItemIdsToReplace],
  )

  const initialSelection = useMemo(() => {
    if (!itemIdsToReplace?.length || !listItemsMap || !entityType) return {}
    const firstItemId = itemIdsToReplace[0]
    const item = listItemsMap.get(firstItemId)

    if (!item?.entityId) return {}

    const selection = { [entityType]: { [item.entityId]: true } }
    switch (item.entityType) {
      case 'folder':
        // folder selection is enough
        break
      case 'task':
        selection.folder = { [item.folderId as string]: true }
        break
      case 'version':
        // @ts-expect-error: id is in product
        selection.product = { [item.product?.id as string]: true }
        selection.folder = { [item.product?.folderId as string]: true }
        break
      default:
        break
    }

    return selection
  }, [itemIdsToReplace, listItemsMap, entityType])

  if (!itemIdsToReplace || !entityType) return null

  return (
    <EntityPickerDialog
      onClose={() => setItemIdsToReplace(null)}
      projectName={projectName}
      entityType={selectedList?.entityType as PickerEntityType}
      onSubmit={replaceListItems}
      isMultiSelect
      // @ts-ignore
      initialSelection={initialSelection}
      isLoading={isReplacing}
      disabledIds={initialSelection[entityType] ? Object.keys(initialSelection[entityType]) : []}
    />
  )
}

export default ReplaceListItemsDialog
