import { useGetFolderListQuery } from '@queries/getHierarchy'
import { useState } from 'react'
import { ExpandedState } from '@tanstack/react-table'
import { $Any } from '@types'
import { useGetExpandedBranchQuery} from '@queries/editor/getEditor'

type Params = {
  projectName: string | null
  folderTypes: $Any
  taskTypes: $Any
  selectedFolders: string[]
}

const useExtendedHierarchyTable = ({ projectName, selectedFolders }: Params) => {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [itemExpanded, setItemExpanded] = useState<string>('root')
  const [attribData, setAttribData] = useState({})

  let { data: branchData = [] } = useGetExpandedBranchQuery({
    projectName,
    parentId: itemExpanded,
  })

  const attribDataDiff = new Set(Object.keys(branchData)).difference(
    new Set(Object.keys(attribData)),
  )
  if (branchData && attribDataDiff.size > 0) {
    setAttribData({ ...attribData, ...branchData })
  }

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

export default useExtendedHierarchyTable