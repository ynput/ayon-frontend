import { useCallback, useMemo } from 'react'
import { TaskType, FolderType } from '../types/project'
import { ProjectModelWithProducts } from '@shared/context'
import { ProductType } from '@shared/api'

type Props = {
  projectInfo?: ProjectModelWithProducts
}

export const useGetEntityTypeData = ({ projectInfo }: Props) => {
  const { folderTypes = [], taskTypes = [], productTypes = [] } = projectInfo || {}

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
    const map: Map<string, ProductType> = new Map()
    for (const productType of productTypes) {
      map.set(productType.name, productType)
    }
    return map
  }, [productTypes])

  const getEntityTypeData = useCallback(
    (type: 'folder' | 'task' | 'product' | string | undefined, subType?: string) => {
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
    },
    [folderTypesByName, taskTypesByName, productTypesByName],
  )

  return getEntityTypeData
}
