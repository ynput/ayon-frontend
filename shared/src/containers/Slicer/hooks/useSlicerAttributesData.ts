import { useGlobalContext } from '@shared/context'

const useSlicerAttributesData = ({ entityTypes }: { entityTypes: string[] }) => {
  const {
    attributes,
    isLoading: { siteInfo: isLoading },
  } = useGlobalContext()

  //   filter attributes by ones that have enums and
  const enumAttributes = attributes
    .filter((attr) => attr.data.enum && attr.data.enum?.length > 0)
    .filter((attrib) => entityTypes.some((et) => attrib.scope?.includes(et as any)))

  return { attributes: enumAttributes, isLoading }
}

export default useSlicerAttributesData
