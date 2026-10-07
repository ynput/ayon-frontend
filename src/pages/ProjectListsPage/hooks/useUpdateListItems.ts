import { useCallback } from 'react'
import { useListsAttributesContext } from '../context/lists-attributes'
import { ProjectTableQueriesProviderProps } from '@shared/containers'
import { useUpdateEntityListItemsMutation } from '@shared/api'
import { useListsContext } from '../context'
import type { OperationWithRowId } from '@shared/containers/ProjectTreeTable'
import { toast } from 'react-toastify'
import { useProjectContext } from '@shared/context'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { getRequestErrorString } from '@shared/util'
import { useListValuesContext } from '../context/list-values'
import type { ListItemsMap } from '../context/list-items-data/ListItemsDataContext'

type Props = {
  updateEntities: ProjectTableQueriesProviderProps['updateEntities']
  listItemsMap: ListItemsMap
}

// Splits table edits between the listed entities and the list items, see listValues/AGENTS.md
const useUpdateListItems = ({ updateEntities, listItemsMap }: Props) => {
  const { projectName } = useProjectContext()
  const { selectedList } = useListsContext()
  const { entityAttribFields, listAttributes } = useListsAttributesContext()
  const { module, rules } = useListValuesContext()
  const { attribFields } = useProjectDataContext()
  const [updateEntityListItems] = useUpdateEntityListItemsMutation()

  const updateListItems = useCallback<ProjectTableQueriesProviderProps['updateEntities']>(
    // @ts-expect-error - we know we are not returning operations response
    async ({ operations, patchOperations }) => {
      const listAttributeNames = listAttributes.map((attribute) => attribute.name)
      const attributeNames = new Set(attribFields.map((attribute) => attribute.name))
      const entityOperations: OperationWithRowId[] = []
      const listItemValues = new Map<string, Record<string, unknown>>()

      for (const operation of operations) {
        const { data = {}, meta, rowId } = operation
        // rows only in the compared list are read-only (paste and multi-cell edits reach here too)
        if (!listItemsMap.has(rowId)) continue
        // compare view columns with the entities' values always write to the entities
        const toEntity = meta?.listValueTarget === 'entity'
        const entityUpdate: Record<string, any> = {}
        const entityAttrib: Record<string, unknown> = {}
        const listValues: Record<string, unknown> = {}

        for (const key in data) {
          if (key === 'attrib' || key === 'ownAttrib') continue
          // attributes only come in `attrib`: a top-level attribute name is a paste into a
          // compare view column, which isn't stored
          if (attributeNames.has(key)) continue
          if (entityAttribFields.includes(key)) entityUpdate[key] = data[key]
          else if (listAttributeNames.includes(key)) listValues[key] = data[key]
        }

        for (const [key, value] of Object.entries(data.attrib || {})) {
          if (listAttributeNames.includes(key)) listValues[key] = value
          else if (toEntity || module.getEditTarget(key, rules) === 'entity')
            entityAttrib[key] = value
          else listValues[key] = value
        }

        if (Object.keys(entityAttrib).length) {
          const entityOwnAttrib = listItemsMap.get(rowId)?.ownAttrib || []
          entityUpdate.attrib = entityAttrib
          entityUpdate.ownAttrib = [
            ...new Set([
              ...entityOwnAttrib,
              ...Object.keys(entityAttrib).filter((key) => entityAttrib[key] !== null),
            ]),
          ]
        }
        if (Object.keys(entityUpdate).length) {
          entityOperations.push({ ...operation, data: entityUpdate })
        }
        if (Object.keys(listValues).length) {
          listItemValues.set(rowId, { ...listItemValues.get(rowId), ...listValues })
        }
      }

      try {
        if (!selectedList?.id) throw new Error('No list selected')

        const updateEntitiesPromise = entityOperations.length
          ? updateEntities({ operations: entityOperations, patchOperations })
          : Promise.resolve()

        const updateListItemsPromise = listItemValues.size
          ? updateEntityListItems({
              projectName,
              listId: selectedList.id,
              entityListMultiPatchModel: {
                mode: 'merge',
                items: [...listItemValues].map(([id, attrib]) => ({ id, attrib })),
              },
            }).unwrap()
          : Promise.resolve()

        return await Promise.all([updateEntitiesPromise, updateListItemsPromise])
      } catch (error) {
        toast.error(getRequestErrorString(error) || 'Error updating list items')
      }
    },
    [
      attribFields,
      entityAttribFields,
      listAttributes,
      listItemsMap,
      module,
      rules,
      projectName,
      selectedList?.id,
      updateEntities,
      updateEntityListItems,
    ],
  )

  return {
    updateListItems,
  }
}

export default useUpdateListItems
