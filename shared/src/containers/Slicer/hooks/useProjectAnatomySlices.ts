import type { UseExtraSlices } from '../context/SlicerContext'
import { useProjectContext } from '@shared/context/ProjectContext'
import type { AttributeModel } from '@shared/api'
import { isEnumIconImage } from '@shared/util/attributeEnum'

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

  // Resolver icons can be image urls (user avatars), which the row would render as an icon name
  const getAttribute = async (attribute: AttributeModel) =>
    !!formatAttribute // if undefined then addon version is too low
      ? formatAttribute(attribute).map((row) =>
          isEnumIconImage(row.icon ?? undefined)
            ? { ...row, icon: undefined, img: row.icon, imgShape: 'circle' as const }
            : row,
        )
      : undefined

  return { project, getStatuses, getTypes, getTaskTypes, getProductTypes, getAttribute, isLoading }
}

export default useProjectAnatomySlices
