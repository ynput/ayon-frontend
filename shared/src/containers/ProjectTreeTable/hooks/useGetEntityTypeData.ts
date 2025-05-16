import { useMemo } from 'react'
import { ProjectModel, TaskType, FolderType } from '../types/project'
import { productTypes } from '@shared/util'

type Props = {
  projectInfo?: ProjectModel
}

const useGetEntityTypeData = ({ projectInfo }: Props) => {
  const { folderTypes = [], taskTypes = [] } = projectInfo || {}

  // create a map of folder types by name for efficient lookups
  const folderTypesByName = useMemo(() => {
    const map: Map<string, FolderType> = new Map()
    for (const folderType of folderTypes) {
      map.set(folderType.name, folderType)
    }
    return map
  }, [folderTypes])

  // create a map of task types by name for efficient lookups
  const taskTypesByName = useMemo(() => {
    const map: Map<string, TaskType> = new Map()
    for (const taskType of taskTypes) {
      map.set(taskType.name, taskType)
    }
    return map
  }, [taskTypes])

  //   convert object to map for product types
  const productTypesByName = useMemo(() => {
    const map: Map<string, any> = new Map()
    for (const name in productTypes) {
      map.set(name, productTypes[name])
    }
    return map
  }, [productTypes])

  const getEntityTypeData = (
    type: 'folder' | 'task' | 'product' | string | undefined,
    subType?: string,
  ) => {
    if (!type || !subType) return
    switch (type) {
      case 'folder':
        return folderTypesByName.get(subType)
      case 'task':
        return taskTypesByName.get(subType)
      case 'product':
        return productTypesByName.get(subType)

      default:
        break
    }
  }

  return getEntityTypeData
}

export default useGetEntityTypeData
