import { useGetProjectsInfoQuery } from '@shared/api'
import type { ProjectModel, TaskType, FolderType } from '@shared/api'
import type { UserColor } from '@ynput/ayon-react-components'
import { intersectionBy } from 'lodash'

type EntityType = (TaskType | FolderType) & UserColor

export const useScopedTypes = (projects: string[], entityType: string) => {
  const response = useGetProjectsInfoQuery({ projects: [...new Set(projects).values()] })

  if (!response || !response.data) {
    return []
  }

  let currentTypes: EntityType[] | undefined
  for (const item of Object.values(response.data) as ProjectModel[]) {
    let types: EntityType[] = []

    if (entityType === 'task') {
      types = item.taskTypes || []
    } else if (entityType === 'folder') {
      types = item.folderTypes || []
    }

    if (currentTypes === undefined) {
      currentTypes = types
      continue
    }
    currentTypes = intersectionBy(currentTypes, types, 'name')
  }

  return currentTypes || []
}