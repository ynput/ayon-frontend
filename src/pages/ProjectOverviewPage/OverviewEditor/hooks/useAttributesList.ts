import { AttributeModel } from "@api/rest/attributes"
import { useGetAttributeListQuery } from "@queries/attributes/getAttributes"

const useAttributeFields = () => {
  // @ts-ignore
  let { data: attribsData = [] } = useGetAttributeListQuery({}, { refetchOnMountOrArgChange: true })

  //   filter out scopes
  const attribFields = attribsData.filter((a: AttributeModel) =>
    a.scope!.some((s: string) => ['folder', 'task'].includes(s)),
  )

  return { attribFields }
}

export default useAttributeFields