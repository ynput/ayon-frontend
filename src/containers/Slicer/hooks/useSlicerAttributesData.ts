import { useGetSiteInfoQuery } from '@shared/api'

const useSlicerAttributesData = ({ skip }: { skip: boolean }) => {
  // get attributes data
  const { data: info, isLoading } = useGetSiteInfoQuery({ full: true }, { skip })
  const { attributes = [] } = info || {}

  //   filter attributes by ones that have enums
  const enumAttributes = attributes.filter((attr) => attr.data.enum && attr.data.enum?.length > 0)

  return { attributes: enumAttributes, isLoading }
}

export default useSlicerAttributesData
