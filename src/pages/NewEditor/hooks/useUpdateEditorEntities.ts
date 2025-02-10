import { $Any } from '@types'
import { Filter } from '@ynput/ayon-react-components'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import api from '@queries/overview/getFilteredEntities'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import { useDispatch } from 'react-redux'
import { mapQueryFilters } from '../mappers/mappers'

type Params = {
  projectName: string
  filters: Filter[]
  sliceFilter: TaskFilterValue | null
}

const useUpdateEditorEntities = ({ projectName, filters, sliceFilter }: Params) => {
  const [bulkUpdateEntities] = useUpdateEntitiesMutation()
  const dispatch = useDispatch()

  const updateEntities = async (
    field: string,
    value: string,
    entities: { id: string; type: string }[],
    isAttrib: boolean,
  ) => {
    if (!entities.length) {
      return
    }

    let operations: { [key: string]: $Any[] } = {}
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

    const queryFilters = mapQueryFilters({ filters, sliceFilter })
    for (const entityType in operations) {
      bulkUpdateEntities({ operations: operations[entityType], entityType: entityType })
      if (entityType === 'task') {
        dispatch(
          api.util.updateQueryData(
            'GetPaginatedFilteredEntities',
            { projectName, ...queryFilters },
            (draft: $Any) => {
              for (const change of changes[entityType]) {
                if (isAttrib) {
                  draft.tasks[change.id].attrib[change.field] = change.value
                } else {
                  draft.tasks[change.id][change.field] = change.value
                }
              }
            },
          ),
        )
      }
      if (entityType === 'folder') {
        dispatch(
          api.util.updateQueryData(
            'getFolderList',
            { projectName, attrib: true },
            (draft: $Any) => {
              for (const change of changes[entityType]) {
                const folder = draft.folders.find((el: $Any) => el.id === change.id)
                if (isAttrib) {
                  folder.attrib[change.field] = change.value
                } else {
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
