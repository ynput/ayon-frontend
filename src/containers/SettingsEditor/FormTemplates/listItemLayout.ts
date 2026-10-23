import { ArrayFieldTemplateProps, Registry } from '@rjsf/utils'
import { $Any } from '@types'
import { SettingFieldKind, getSettingFieldKind, resolveFlatObjectLayout } from '../SettingField'
import { isComplexListItem, isGroupSchema } from '../SettingsGroup/SettingsGroupHelpers'

// Field kinds that fit in a table cell: one line, one value, nothing nested
const CELL_KINDS: SettingFieldKind[] = ['text', 'number', 'select', 'color', 'toggle']

/**
 * Whether a list item reads best as a boxed row: fields side by side in one box, their
 * labels shown once above the list. Items with 2 or 3 fields that each fit in a cell
 * qualify, as schemas with the "compact" layout already do.
 */
export const isRowListItem = (schema: $Any, registry: Registry): boolean => {
  if (schema?.type !== 'object' || !['expanded', undefined].includes(schema.layout)) return false
  const properties = Object.values<$Any>(schema.properties || {})
  if (properties.length < 2 || properties.length > 3) return false
  return properties.every((property) => {
    const resolved = registry.schemaUtils.retrieveSchema(property)
    // a multi-select holds several values and outgrows a cell
    return resolved?.type !== 'array' && CELL_KINDS.includes(getSettingFieldKind(resolved))
  })
}

// Longest text a cell shows whole when it shares the row with another text cell
const MAX_SHARED_CELL_CHARS = 40

/**
 * Whether a list's values fit its rows. With two or more text cells sharing a row,
 * long values (paths, templates) would be cut off, so the whole list keeps its other
 * layout. One text cell takes all the room left, so its values always fit.
 */
export const listValuesFitRows = (schema: $Any, registry: Registry, values: $Any[]) => {
  const textKeys = Object.entries<$Any>(schema?.properties || {})
    .filter(
      ([, property]) =>
        getSettingFieldKind(registry.schemaUtils.retrieveSchema(property)) === 'text',
    )
    .map(([key]) => key)
  if (textKeys.length < 2) return true
  return (values || []).every((value) =>
    textKeys.every((key) => String(value?.[key] ?? '').length <= MAX_SHARED_CELL_CHARS),
  )
}

/**
 * How a list's items are drawn in the flat layout, decided once for the whole list:
 * - `rowsFit`: short items may be boxed rows, judged on the saved values, so typing a
 *   long value never flips the list's layout
 * - `itemsFold`: items are folding boxes (same rule as useListItemFold)
 */
export const getListLayout = ({
  schema,
  registry,
  formData,
  formContext,
  idSchema,
}: ArrayFieldTemplateProps) => {
  const items = schema.items
  const resolved =
    items && typeof items === 'object' && !Array.isArray(items)
      ? registry.schemaUtils.retrieveSchema(items)
      : null
  if (!resolved) return { rowsFit: false, itemsFold: false }

  const savedItems = (formData || []).map((value: $Any, index: number) =>
    Object.fromEntries(
      Object.keys(value || {}).map((key) => [
        key,
        formContext?.overrides?.[`${idSchema.$id}_${index}_${key}`]?.originalValue ?? '',
      ]),
    ),
  )
  const rowsFit = listValuesFitRows(resolved, registry, savedItems)
  const fieldCount = Object.keys(resolved.properties || {}).length
  const itemsFold =
    !(rowsFit && isRowListItem(resolved, registry)) &&
    isComplexListItem(resolved) &&
    resolveFlatObjectLayout(resolved.layout, fieldCount) !== 'compact'
  return { rowsFit, itemsFold }
}

// Fewest sibling groups of one shape that read as a list of records
const MIN_FOLDING_GROUPS = 4

// Groups share a shape when they use the same model, or failing that the same fields
const getGroupShape = (property: $Any, resolved: $Any) =>
  property?.$ref ||
  property?.allOf?.find((part: $Any) => part?.$ref)?.$ref ||
  Object.keys(resolved?.properties || {})
    .sort()
    .join('|')

/**
 * The groups of an object that fold like list items: 4 or more groups that read as
 * records of a list, so they fold to a titled row. Either they all share one shape
 * (Applications' definitions), or most of them can be turned on and off (plugin settings:
 * each has its own fields, but an "enabled" switch). They are fixed entries (no handle, X
 * or add button). All of them fold or none do, so a card never mixes boxes and sections.
 * Maps each one to its resolved schema.
 */
export const getFoldingGroupNames = (
  schema: $Any,
  registry: Registry,
  formData: $Any,
  names: string[],
) => {
  const groups = new Map<string, $Any>()
  const shapes = new Set<string>()
  let switchable = 0
  for (const name of names) {
    const property = schema?.properties?.[name]
    if (!property || typeof property !== 'object') continue
    const resolved: $Any = registry.schemaUtils.retrieveSchema(property, formData?.[name])
    if (resolved?.type !== 'object' || !isGroupSchema(resolved)) continue
    groups.set(name, resolved)
    shapes.add(getGroupShape(property, resolved))
    if (resolved.properties?.enabled?.type === 'boolean') switchable++
  }
  if (groups.size < MIN_FOLDING_GROUPS) return new Map<string, $Any>()
  const sameShape = shapes.size === 1 && [...groups.values()].every(isComplexListItem)
  const mostSwitchable = switchable > groups.size / 2
  return sameShape || mostSwitchable ? groups : new Map<string, $Any>()
}
