import { UseExtraSlices } from '@context/SlicerContext'
import { useGetProjectQuery } from '@queries/project/enhancedProject'
import { AttributeModel } from '@shared/api'

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

  const { formatStatuses, formatTaskTypes, formatTypes, formatAttribute } = useExtraSlices()

  const getStatuses = async () => formatStatuses(project)

  const getTypes = async () => formatTypes(project)

  const getTaskTypes = async () => formatTaskTypes(project)

  const getAttribute = async (attribute: AttributeModel) =>
    !!formatAttribute ? formatAttribute(attribute) : undefined // if undefined then addon version is too low

  return { project, getStatuses, getTypes, getTaskTypes, getAttribute, isLoading }
}

export default useProjectAnatomySlices
