import { useGetSiteInfoQuery } from '@shared/api'

const useSlicerAttributesData = ({
  skip,
  entityTypes,
}: {
  skip: boolean
  entityTypes: string[]
}) => {
  // get attributes data
  const { data: info, isLoading } = useGetSiteInfoQuery({ full: true }, { skip })
  const { attributes = [] } = info || {}

  //   filter attributes by ones that have enums and
  const enumAttributes = attributes
    .filter((attr) => attr.data.enum && attr.data.enum?.length > 0)
    .filter((attrib) => entityTypes.some((et) => attrib.scope?.includes(et as any)))

  return { attributes: enumAttributes, isLoading }
}

export default useSlicerAttributesData
