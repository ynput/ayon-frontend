import type { ProjectModel } from '@shared/api'
import type { NewEntityType } from '../context/NewEntityContext'

// Helper function to generate label based on entity type and selected subtype
export const generateLabel = (
  type: NewEntityType | null,
  subType: string,
  projectInfo: ProjectModel | undefined,
): string => {
  if (!type || !subType) return ''

  const typeOption = (type === 'folder' ? projectInfo?.folderTypes : projectInfo?.taskTypes)?.find(
    (option) => option.name === subType,
  )

  if (!typeOption) return ''

  return typeOption.name
}
