import { useMemo } from 'react'
import { getDefaultRegistry } from '@rjsf/core'
import { FieldProps } from '@rjsf/utils'
import { PathMappingContext } from './PathMappingContextInstance'
import { isPathMappingSchema } from './PathMappingHelpers'

const DefaultObjectField = getDefaultRegistry().fields.ObjectField

/**
 * RJSF's own object field. A directory mapping in the flat layout also gets a write for
 * the whole object (PathMappingContext), which ObjectFields uses to draw it as pairs.
 * Everything else, and the classic layout, renders exactly as before.
 */
const SettingsObjectField = (props: FieldProps) => {
  const isMapping = !!props.registry.formContext?.flatLayout && isPathMappingSchema(props.schema)
  const objectId = props.idSchema.$id
  const { onChange } = props
  const mapping = useMemo(
    () => (isMapping ? { objectId, onChange: (data: object) => onChange(data) } : null),
    [isMapping, objectId, onChange],
  )

  if (!mapping) return <DefaultObjectField {...props} />
  return (
    <PathMappingContext.Provider value={mapping}>
      <DefaultObjectField {...props} />
    </PathMappingContext.Provider>
  )
}

export default SettingsObjectField
