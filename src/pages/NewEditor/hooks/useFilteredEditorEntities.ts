import { useGetFolderListQuery } from '@queries/getHierarchy'
import { useState } from 'react'
import { ExpandedState } from '@tanstack/react-table'
import { $Any } from '@types'

type Params = {
  projectName: string | null
  folderTypes: $Any
  taskTypes: $Any
  selectedFolders: string[]
}

const useFilteredEditorEntities = ({ projectName, selectedFolders }: Params) => {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [itemExpanded, setItemExpanded] = useState<string>('root')

  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
  } = useGetFolderListQuery({ projectName: projectName || '' }, { skip: !projectName })
  let foldersById = folders.reduce(function (map, obj) {
    //@ts-ignore
    map[obj.id] = obj
    return map
  }, {})

  // @ts-ignore
  const selectedPaths = selectedFolders.map((id) => foldersById[id].path)
  const selectedPathsPrefixed = selectedPaths.map((path: string) => '/' + path)

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

  return {
    rawData: filteredFolders,
    isLoading: isLoading || isFetching,
    setExpandedItem: setItemExpanded,
    expanded,
    setExpanded,
    selectedPaths: selectedPathsPrefixed,
  }
}

export default useFilteredEditorEntities