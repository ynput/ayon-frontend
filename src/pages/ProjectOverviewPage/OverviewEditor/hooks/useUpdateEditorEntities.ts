import { $Any } from '@types'
import tasksApi from '@queries/overview/getFilteredEntities'
import hierarchyApi from '@queries/getHierarchy'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import { useDispatch, useStore } from 'react-redux'
import { useAppSelector } from '@state/store'
import { CellId } from '../utils/cellUtils'
import { CellValue } from '../Cells/EditorCell'

export type UpdateTableEntities = (
  field: string,
  value: CellValue | CellValue[],
  entities: { id: string; type: string }[],
  isAttrib: boolean,
) => Promise<void>

export type UpdateTableEntity = (
  cellId: CellId,
  value: string,
  { includeSelection }: { includeSelection: boolean },
) => Promise<void>

const useUpdateEditorEntities = () => {
  const projectName = useAppSelector((state) => state.project.name)
  const [bulkUpdateEntities] = useUpdateEntitiesMutation()
  const dispatch = useDispatch()
  const store = useStore()

  const updateEntities: UpdateTableEntities = async (field, value, entities, isAttrib) => {
    if (!entities.length || !projectName) {
      return
    }

    // operations used for updating the entities in the database
    let operations: { [key: string]: $Any[] } = {}
    // changes used for updating the cache
    let changes: { [key: string]: $Any[] } = {}

    for (const entity of entities) {
      if (operations[entity.type] === undefined) {
        operations[entity.type] = []
        changes[entity.type] = []
      }
      operations[entity.type].push({
        id: entity.id,
        projectName,
        data: isAttrib ? { attrib: { [field]: value } } : { [field]: value },
      })

      changes[entity.type].push({
        id: entity.id,
        field: field,
        value,
      })
    }

    for (const entityType in operations) {
      bulkUpdateEntities({ operations: operations[entityType], entityType: entityType })
      if (entityType === 'task') {
        const state: any = store.getState()
        const tags = [{ type: 'editorTask', id: 'LIST' }]
        const entries = tasksApi.util.selectInvalidatedBy(state, tags)

        console.log(entries)

        for (const entry of entries) {
          dispatch(
            // @ts-ignore
            tasksApi.util.updateQueryData(
              'GetFilteredEntitiesByParent',
              entry.originalArgs,
              (draft) => {
                for (const change of changes[entityType]) {
                  const task = draft.find((task) => task.id === change.id)
                  if (task) {
                    if (isAttrib) {
                      ;(task.attrib as { [key: string]: any })[change.field] = change.value
                    } else {
                      ;(task as { [key: string]: any })[change.field] = change.value
                    }
                  }
                }
              },
            ),
          )
        }
      }
      if (entityType === 'folder') {
        dispatch(
          // @ts-ignore
          hierarchyApi.util.updateQueryData(
            'getFolderList',
            { projectName, attrib: true },
            (draft) => {
              for (const change of changes[entityType]) {
                const folder = draft.folders.find((el) => el.id === change.id)
                if (isAttrib) {
                  // @ts-ignore
                  folder.attrib[change.field] = change.value
                } else {
                  // @ts-ignore
                  folder[change.field] = change.value
                }
              }
            },
          ),
        )
      }
    }
  }

  return { updateEntities }
}

export default useUpdateEditorEntities
