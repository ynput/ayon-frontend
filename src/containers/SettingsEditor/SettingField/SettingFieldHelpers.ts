import { $Any } from '@types'

export type SettingFieldKind =
  | 'toggle'
  | 'text'
  | 'textarea'
  | 'code'
  | 'number'
  | 'date'
  | 'color'
  | 'select'
  | 'list'
  | 'choice'
  | 'switchbox'
  | 'other'

// Kinds that share one line with their label: fixed-size controls, dropdowns and text fields
// (long text folds to one line, SettingsTextFold). Lists, switchboxes and unknown kinds put
// their label above
const INLINE_KINDS: SettingFieldKind[] = [
  'toggle',
  'number',
  'date',
  'color',
  'choice',
  'select',
  'text',
  'textarea',
  'code',
]

export const isInlineFieldKind = (kind?: SettingFieldKind) => !!kind && INLINE_KINDS.includes(kind)

export const isStackedFieldKind = (kind?: SettingFieldKind) => !!kind && !isInlineFieldKind(kind)

// Compact rows wider than this read badly side by side, so they stack instead
const MAX_FLAT_ROW_FIELDS = 3

/**
 * The layout an object actually gets in the flat layout, from its schema hint.
 * Short compact rows stay rows. Long ones and "expanded" (a name column beside
 * the other fields) become ordinary vertical groups.
 */
export const resolveFlatObjectLayout = (layout: string | undefined, visibleFieldCount: number) => {
  if (layout === 'compact' && visibleFieldCount > MAX_FLAT_ROW_FIELDS) return undefined
  if (layout === 'expanded') return undefined
  return layout
}

const hasOptions = (schema: $Any) =>
  !!(schema?.enum || schema?.anyOf || schema?.oneOf || schema?.items?.enum)

/**
 * What kind of control a leaf field renders, read from its schema.
 * Follows the same branches as TextWidget and the widget map in SettingsEditor.
 */
export const getSettingFieldKind = (schema: $Any): SettingFieldKind => {
  if (!schema) return 'other'
  // a boolean is always a switch, even with the "permission" widget (only numbers get buttons)
  if (schema.type === 'boolean') return 'toggle'
  if (schema.widget === 'color') return 'color'
  // DateTimeWidget, which the form uses for this format
  if (schema.format === 'date-time') return 'date'
  if (schema.widget === 'icon') return 'select'
  if (schema.widget === 'permission') return 'choice'
  // a list of options, each with its own switch: rows of their own
  if (schema.widget === 'switchbox') return 'switchbox'
  if (schema.widget === 'access') return 'other'
  if (hasOptions(schema)) return 'select'

  switch (schema.type) {
    case 'integer':
    case 'number':
      return 'number'
    case 'array':
      return 'list'
    case 'string':
      if (schema.widget === 'textarea') return schema.syntax ? 'code' : 'textarea'
      return 'text'
    default:
      return 'other'
  }
}
