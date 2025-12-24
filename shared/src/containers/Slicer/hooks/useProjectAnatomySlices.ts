import { UseExtraSlices } from '@shared/containers/Slicer'
import { useProjectContext } from '@shared/context'
import { AttributeModel } from '@shared/api'

type Props = {
  scopes?: string[]
  useExtraSlices: UseExtraSlices
}

const useProjectAnatomySlices = ({ scopes, useExtraSlices }: Props) => {
  const { isLoading, productTypes, ...project } = useProjectContext()

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
