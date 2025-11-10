import { UseExtraSlices } from '@context/SlicerContext'
import { useGetProjectQuery } from '@queries/project/enhancedProject'
import { AttributeModel } from '@shared/api'
import { productTypes } from '@shared/util'

type Props = {
  projectName: string | null
  scopes?: string[]
  useExtraSlices: UseExtraSlices
}

const useProjectAnatomySlices = ({ projectName, scopes, useExtraSlices }: Props) => {
  // project info
  const { data: project, isLoading } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )

  const { formatStatuses, formatTaskTypes, formatProductTypes, formatTypes, formatAttribute } =
    useExtraSlices()

  const getStatuses = async () => formatStatuses(project, scopes)

  const getTypes = async () => formatTypes(project)

  const getTaskTypes = async () => formatTaskTypes(project)

  const getProductTypes = async () => formatProductTypes(productTypes)

  const getAttribute = async (attribute: AttributeModel) =>
    !!formatAttribute ? formatAttribute(attribute) : undefined // if undefined then addon version is too low

  return { project, getStatuses, getTypes, getTaskTypes, getProductTypes, getAttribute, isLoading }
}

export default useProjectAnatomySlices
