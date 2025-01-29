import { useGetFolderListQuery } from '@queries/getHierarchy'
import { useState } from 'react'
import { ExpandedState } from '@tanstack/react-table'
import { $Any } from '@types'
import { Filter } from '@ynput/ayon-react-components'
import { useGetFilteredEntitiesQuery } from '@queries/overview/getFilteredEntities'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { mapQueryFilters } from '../mappers'

type Params = {
  projectName: string
  folderTypes: $Any
  taskTypes: $Any
  selectedFolders: string[]
  filters: Filter[],
  sliceFilter: TaskFilterValue | null,
}

const useFilteredEditorEntities = ({
  projectName,
  selectedFolders,
  filters,
  sliceFilter,
}: Params) => {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [itemExpanded, setItemExpanded] = useState<string>('root')

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
  const queryFilters = mapQueryFilters({ filters, sliceFilter })


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

  let folderIds: string[] = []
  if (Object.keys(selectedFolders).length == 0) {
    // Falling back to root nodes when no sidebar selection in place
    folderIds = folders.filter((el) => el.parentId === null).map((el) => el.id)
  } else {
    folderIds = selectedFolders
  }

  const entities = useGetFilteredEntitiesQuery({
    projectName,
    // Reintroduce queryFilters after testing is ready
    // ...queryFilters,
  })

  const tasks = entities.data?.tasks || {}

  return {
    rawData: filteredFolders,
    folders: folders.reduce((acc, curr) => ({ ...acc, [curr.id as string]: curr }), {}),
    tasks,
    isLoading: isLoading || isFetching,
    setExpandedItem: setItemExpanded,
    expanded,
    setExpanded,
    selectedPaths: selectedPathsPrefixed,
  }
}

export default useFilteredEditorEntities