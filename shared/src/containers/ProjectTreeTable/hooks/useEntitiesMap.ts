import { useMemo } from 'react'
import type { FolderNodeMap, TaskNodeMap } from '@shared/containers/ProjectTreeTable'

interface UseEntitiesMapProps {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
}

export const useEntitiesMap = ({ foldersMap, tasksMap }: UseEntitiesMapProps) => {
  return useMemo(() => {
    const combined: FolderNodeMap & TaskNodeMap = new Map()

    foldersMap.forEach((folder) => {
      combined.set(folder.id, folder)
    })

    tasksMap.forEach((task) => {
      combined.set(task.id, task)
    })

    return combined
  }, [foldersMap, tasksMap])
}
