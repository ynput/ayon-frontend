import { useGetSiteInfoQuery, AttributeModel } from '@shared/api'
import { useGetMyProjectPermissionsQuery } from '@queries/permissions/getPermissions'

export interface AttributeWithPermissions extends AttributeModel {
  readOnly?: boolean
}

const useAttributeFields = ({ projectName }: { projectName: string }) => {
  const { data: info, isSuccess, isFetching } = useGetSiteInfoQuery({ full: true })
  const { attributes = [] } = info || {}

  const { data: projectPermissions } = useGetMyProjectPermissionsQuery(
    { projectName },
    { skip: !projectName },
  )
  const { attrib_read, attrib_write } = projectPermissions || {}
  const { enabled: attribReadEnabled, attributes: attribReadAttributes } = attrib_read || {}
  const { enabled: attribWriteEnabled, attributes: attribWriteAttributes } = attrib_write || {}

  //   filter out scopes and filter out attributes that do not have read access
  const attribFields: AttributeWithPermissions[] = attributes
    .filter((a) => !attribReadEnabled || attribReadAttributes?.includes(a.name))
    .map((a) => ({
      ...a,
      readOnly: attribWriteEnabled ? !attribWriteAttributes?.includes(a.name) : false,
    }))

  return { attribFields, isSuccess, isFetching }
}

export default useAttributeFields
