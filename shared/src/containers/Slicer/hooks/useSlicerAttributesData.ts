import { useContext } from 'react'
import { useGlobalContext } from '@shared/context/GlobalContext'
import { ProjectDataContext } from '@shared/containers/ProjectTreeTable/context/ProjectDataContextInstance'
import { hasEnumOptions, getSelectableEnumItems } from '@shared/util'
import { useAttributeEnums } from '@shared/hooks/useAttributeEnums'
import type { AttributeEnumsRequest } from '@shared/hooks/useAttributeEnums'
import { useProjectContext } from '@shared/context/ProjectContext'

interface UseSlicerAttributesDataParams {
  entityTypes: string[]
  // only the slice the user picked needs its options resolved
  request?: AttributeEnumsRequest
}

const useSlicerAttributesData = ({ entityTypes, request }: UseSlicerAttributesDataParams) => {
  const {
    attributes,
    isLoading: { siteInfo: isLoading },
  } = useGlobalContext()

  const projectData = useContext(ProjectDataContext)
  const source = projectData?.attribFields?.length ? projectData.attribFields : attributes
  const { projectName } = useProjectContext()

  // resolve before the filters below: they read data.enum
  const resolved = useAttributeEnums(source, { projectName, request: request ?? [] })

  // Slicer rows are choices only, so hidden items are dropped here
  const enumAttributes = resolved
    .filter((attr) => hasEnumOptions(attr.data))
    .filter((attrib) => entityTypes.some((et) => attrib.scope?.includes(et as any)))
    .map((attr) =>
      attr.data.enum?.some((item) => item.hidden)
        ? { ...attr, data: { ...attr.data, enum: getSelectableEnumItems(attr.data.enum) } }
        : attr,
    )

  return { attributes: enumAttributes, isLoading }
}

export default useSlicerAttributesData
