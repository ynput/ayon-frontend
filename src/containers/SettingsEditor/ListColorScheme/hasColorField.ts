import { Registry } from '@rjsf/utils'
import { $Any } from '@types'
import { resolveSchema } from '../FormTemplates/schemaCache'

/** Whether the items of a list of records have a `color` field (the colour widget) */
export const hasColorField = (items: $Any, registry: Registry): boolean => {
  if (!items || typeof items !== 'object' || Array.isArray(items)) return false
  const item = resolveSchema(registry.schemaUtils, items)
  return item?.type === 'object' && (item.properties?.color as $Any)?.widget === 'color'
}
