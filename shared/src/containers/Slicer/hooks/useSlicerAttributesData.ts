import { useContext } from 'react'
import { useGlobalContext } from '@shared/context/GlobalContext'
import { ProjectDataContext } from '@shared/containers/ProjectTreeTable/context/ProjectDataContextInstance'
import { hasEnumOptions } from '@shared/util'

const useSlicerAttributesData = ({ entityTypes }: { entityTypes: string[] }) => {
  const {
    attributes,
    isLoading: { siteInfo: isLoading },
  } = useGlobalContext()

  // Prefer project attributes: their dynamic enums are already resolved.
  const projectData = useContext(ProjectDataContext)
  const source = projectData?.attribFields?.length ? projectData.attribFields : attributes

  const enumAttributes = source
    .filter((attr) => hasEnumOptions(attr.data))
    .filter((attrib) => entityTypes.some((et) => attrib.scope?.includes(et as any)))

  return { attributes: enumAttributes, isLoading }
}

export default useSlicerAttributesData
