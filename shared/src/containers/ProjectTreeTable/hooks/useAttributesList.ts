import { useGetSiteInfoQuery, AttributeModel, Permissions } from '@shared/api'

export interface ProjectTableAttribute extends AttributeModel {
  readOnly?: boolean
}

interface UseAttributeFieldsParams {
  projectName: string
  projectPermissions?: Permissions
}

const useAttributeFields = ({ projectName, projectPermissions }: UseAttributeFieldsParams) => {
  const { data: info, isSuccess, isFetching } = useGetSiteInfoQuery({ full: true })
  const { attributes = [] } = info || {}

  const { attrib_read, attrib_write } = projectPermissions || {}
  const { enabled: attribReadEnabled, attributes: attribReadAttributes } = attrib_read || {}
  const {
    enabled: attribWriteEnabled,
    attributes: attribWriteAttributes,
    fields: writableFields,
  } = attrib_write || {}

  //   filter out scopes and filter out attributes that do not have read access
  const attribFields: ProjectTableAttribute[] = attributes
    .filter((a) => !attribReadEnabled || attribReadAttributes?.includes(a.name))
    .map((a) => ({
      ...a,
      readOnly: attribWriteEnabled ? !attribWriteAttributes?.includes(a.name) : false,
    }))

  return { attribFields, writableFields, isSuccess, isFetching }
}

export default useAttributeFields
