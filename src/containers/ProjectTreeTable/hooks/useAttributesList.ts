import { AttributeModel } from '@api/rest/attributes'
import { useGetSiteInfoQuery } from '@queries/auth/getAuth'

const useAttributeFields = () => {
  const { data: info, isSuccess, isFetching } = useGetSiteInfoQuery({ full: true })
  const { attributes = [] } = info || {}

  //   filter out scopes
  const attribFields = attributes.filter((a: AttributeModel) =>
    a.scope!.some((s: string) => ['folder', 'task'].includes(s)),
  )

  return { attribFields, isSuccess, isFetching }
}

export default useAttributeFields
