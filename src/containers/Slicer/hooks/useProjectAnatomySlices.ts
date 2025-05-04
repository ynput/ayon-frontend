import { UseExtraSlices } from '@context/SlicerContext'
import { useGetProjectQuery } from '@queries/project/enhancedProject'
type Props = {
  projectName: string | null
  useExtraSlices: UseExtraSlices
}

const useProjectAnatomySlices = ({ projectName, useExtraSlices }: Props) => {
  // project info
  const { data: project, isLoading } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )

  const { formatStatuses, formatTaskTypes, formatTypes } = useExtraSlices()

  const getStatuses = async () => formatStatuses(project)

  const getTypes = async () => formatTypes(project)

  const getTaskTypes = async () => formatTaskTypes(project)

  return { project, getStatuses, getTypes, getTaskTypes, isLoading }
}

export default useProjectAnatomySlices
