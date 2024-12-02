import useLoadRemote from '@/remote/useLoadRemote'
import { ProjectModel } from '@api/rest/project'
import { useGetProjectQuery } from '@queries/project/getProject'

type Props = {
  projectName: string | null
}

const useExtraSlicesDefault = () => {
  return {
    formatStatuses: (_p?: ProjectModel) => [],
    formatTaskTypes: (_p?: ProjectModel) => [],
    formatTypes: (_p?: ProjectModel) => [],
  }
}

const useProjectAnatomySlices = ({ projectName }: Props) => {
  // project info
  const { data: project, isLoading } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )

  const useExtraSlices = useLoadRemote({
    remote: 'slicer',
    module: 'useExtraSlices',
    fallback: useExtraSlicesDefault,
  })

  const { formatStatuses, formatTaskTypes, formatTypes } = useExtraSlices()

  const getStatuses = async () => formatStatuses(project)

  const getTypes = async () => formatTypes(project)

  const getTaskTypes = async () => formatTaskTypes(project)

  return { project, getStatuses, getTypes, getTaskTypes, isLoading }
}

export default useProjectAnatomySlices
