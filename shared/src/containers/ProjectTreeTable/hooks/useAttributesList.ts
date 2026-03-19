import { AttributeModel, Permissions } from '@shared/api'
import { useGlobalContext } from '@shared/context'

export interface ProjectTableAttribute extends AttributeModel {
  readOnly?: boolean
}

interface UseAttributeFieldsParams {
  projectPermissions?: Permissions
}

const useAttributeFields = ({ projectPermissions }: UseAttributeFieldsParams) => {
  const {
    attributes,
    isLoading: { siteInfo: isLoading },
  } = useGlobalContext()

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

  return { attribFields, writableFields, isLoading }
}

export default useAttributeFields
