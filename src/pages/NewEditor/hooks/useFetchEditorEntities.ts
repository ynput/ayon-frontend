import { useGetFolderListQuery } from '@queries/getHierarchy'
import { $Any } from '@types'
import { Filter } from '@ynput/ayon-react-components'
import { useGetPaginatedFilteredEntitiesQuery } from '@queries/overview/getFilteredEntities'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import  api from '@queries/overview/getFilteredEntities'
// import { mapQueryFilters } from '../mappers'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import { useDispatch } from 'react-redux'

type Params = {
  projectName: string
  folderTypes: $Any
  taskTypes: $Any
  selectedFolders: string[]
  filters: Filter[],
  sliceFilter: TaskFilterValue | null,
}

const useFetchEditorEntities = ({
  projectName,
  selectedFolders,
  // filters,
  // sliceFilter,
}: Params) => {
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
      if (operations[entity.type]  === undefined) {
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
      await bulkUpdateEntities({ operations: operations[entityType], entityType: entityType })
      if (entityType === 'task') {
        dispatch(
          api.util.updateQueryData('GetFilteredEntities', { projectName }, (draft: $Any) => {
            for (const change of changes[entityType] ) {
              if (isAttrib) {
                draft.tasks[change.id].attrib[change.field] = change.value
              } else {
                draft.tasks[change.id][change.field] = change.value
              }
            }
          }),
        )
      }
      if (entityType === 'folder') {
        dispatch(
          api.util.updateQueryData('getFolderList', { projectName, attrib: true }, (draft: $Any) => {
            for (const change of changes[entityType]) {
              const folder = draft.folders.find((el: $Any) => el.id === change.id)
              if (isAttrib) {
                folder.attrib[change.field] = change.value
              } else {
                folder[change.field] = change.value
              }
            }
          }),
        )
      }

    }
  }

  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
  } = useGetFolderListQuery(
    { projectName: projectName || '', attrib: true },
    { skip: !projectName },
  )
  let foldersById = folders.reduce(function (map, obj) {
    //@ts-ignore
    map[obj.id] = obj
    return map
  }, {})

  // @ts-ignore
  const selectedPaths = selectedFolders.map((id) => foldersById[id].path)
  const selectedPathsPrefixed = selectedPaths.map((path: string) => '/' + path)
  // const queryFilters = mapQueryFilters({ filters, sliceFilter })

  const filteredFolders =
    selectedPaths.length > 0
      ? folders.filter((el) => {
          for (const path of selectedPaths) {
            if (el.path.startsWith(path)) {
              return true
            }
          }
          return false
        })
      : folders

  const entities = useGetPaginatedFilteredEntitiesQuery({projectName, first: 500})
  const tasks = entities.data?.tasks || {}

  return {
    rawData: filteredFolders,
    folders: folders.reduce((acc, curr) => ({ ...acc, [curr.id as string]: curr }), {}),
    tasks,
    isLoading: isLoading || isFetching,
    selectedPaths: selectedPathsPrefixed,
    updateEntities,
  }
}

export default useFetchEditorEntities