import { useGetProjectQuery } from '@shared/api'
import { useGlobalContext } from '@shared/context'

interface UseEntityDataProps {
  projectName?: string
  isProjectNameMixed: boolean
}

export const useEntityData = ({ projectName, isProjectNameMixed }: UseEntityDataProps) => {
  const { attributes } = useGlobalContext()
  const { data: projectData } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName || isProjectNameMixed },
  )
  const { folderTypes = [], taskTypes = [], statuses = [], tags = [] } = projectData || {}

  return {
    folderTypes,
    taskTypes,
    statuses,
    tags,
    attributes,
  }
}
