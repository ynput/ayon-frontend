import { useGetSiteInfoQuery, useGetProjectQuery } from '@shared/api'

interface UseEntityDataProps {
  projectName?: string
  isProjectNameMixed: boolean
}

export const useEntityData = ({ projectName, isProjectNameMixed }: UseEntityDataProps) => {
  const { data: projectData } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName || isProjectNameMixed },
  )
  const { folderTypes = [], taskTypes = [], statuses = [], tags = [] } = projectData || {}

  const { data: info } = useGetSiteInfoQuery({ full: true })
  const { attributes = [] } = info || {}

  return {
    folderTypes,
    taskTypes,
    statuses,
    tags,
    attributes,
  }
}
