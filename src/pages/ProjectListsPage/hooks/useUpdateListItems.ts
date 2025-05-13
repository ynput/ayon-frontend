import { useCallback } from 'react'
import { useListItemsDataContext } from '../context/ListItemsDataContext'
import { useListsAttributesContext } from '../context/ListsAttributesContext'
import { ProjectTableQueriesProviderProps } from '@shared/containers'
import { useUpdateEntityListItemMutation } from '@shared/api'
import { useListsContext } from '../context/ListsContext'
import type { OperationWithRowId } from '@shared/containers/ProjectTreeTable'
import { toast } from 'react-toastify'

type Props = {
  updateEntities: ProjectTableQueriesProviderProps['updateEntities']
}

const useUpdateListItems = ({ updateEntities }: Props) => {
  const { selectedList } = useListsContext()
  const { projectName, listItemsMap } = useListItemsDataContext()
  const { entityAttribFields } = useListsAttributesContext()
  const [updateEntityListItem] = useUpdateEntityListItemMutation()

  // intercept the updateEntities function so that we can update custom attributes differently
  const updateListItems = useCallback<ProjectTableQueriesProviderProps['updateEntities']>(
    // @ts-expect-error - we know we are not returning operations response
    async ({ operations, patchOperations }) => {
      // split between updating entity directly and updating attributes on list items
      const entityOperations: OperationWithRowId[] = [],
        listItemOperations: OperationWithRowId[] = []

      operations.forEach((operation) => {
        // get list item by rowId
        const { data } = operation

        type UpdateOperation = { [key: string]: any }
        const entityUpdate: UpdateOperation = {},
          listItemUpdate: UpdateOperation = {}

        for (const key in data) {
          if (key === 'attrib' || key === 'ownAttrib') continue
          // check if the field is an entity attributes or custom attribute
          const isCustom = !entityAttribFields.includes(key)
          if (isCustom) {
            listItemUpdate[key] = data[key]
          } else {
            entityUpdate[key] = data[key]
          }
        }

        if (data?.attrib) {
          for (const key in data.attrib) {
            // check if the field is an entity attributes or custom attribute
            const isCustom = !entityAttribFields.includes(key)
            if (isCustom) {
              listItemUpdate[key] = data.attrib[key]
            } else {
              entityUpdate['attrib'] = entityUpdate['attrib'] || {}
              entityUpdate['attrib'][key] = data.attrib[key]
            }
          }
        }

        if (data?.ownAttrib) {
          // ownAttrib always added to entityUpdate
          entityUpdate['ownAttrib'] = data.ownAttrib
        }

        // add entity and list item updates to the respective arrays
        if (Object.keys(entityUpdate).length > 0) {
          entityOperations.push({
            ...operation,
            data: entityUpdate,
          })
        }
        if (Object.keys(listItemUpdate).length > 0) {
          listItemOperations.push({
            ...operation,
            data: listItemUpdate,
          })
        }
      })

      try {
        if (!selectedList?.id) throw new Error('No list selected')

        const updateEntitiesPromise = updateEntities({
          operations,
          patchOperations,
        })

        const updateListItemsPromise = listItemOperations.map((operation) =>
          updateEntityListItem({
            projectName,
            listId: selectedList.id,
            listItemId: operation.rowId,
            entityListItemPatchModel: {
              attrib: operation.data,
            },
          }).unwrap(),
        )

        return await Promise.all([updateEntitiesPromise, ...updateListItemsPromise])
      } catch (error) {
        toast.error('Error updating list items')
      }
    },
    [listItemsMap, entityAttribFields, updateEntities],
  )

  return {
    updateListItems,
  }
}

export default useUpdateListItems
