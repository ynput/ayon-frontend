import { AttributeModel } from '@api/rest/attributes'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'

const useAttributeFields = () => {
  let { data: attribsData = [] } = useGetAttributeListQuery(undefined)

  //   filter out scopes
  const attribFields = attribsData.filter((a: AttributeModel) =>
    a.scope!.some((s: string) => ['folder', 'task'].includes(s)),
  )

  return { attribFields }
}

export default useAttributeFields
