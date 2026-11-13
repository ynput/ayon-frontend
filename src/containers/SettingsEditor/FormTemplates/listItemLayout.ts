import { Registry } from '@rjsf/utils'
import { $Any } from '@types'
import { SettingFieldKind, getSettingFieldKind } from '../SettingField'
import {
  PLATFORM_KEYS,
  isComplexListItem,
  isGroupSchema,
  isPropertyInScope,
} from '../SettingsGroup/SettingsGroupHelpers'

// Field kinds that fit in a table cell: one line, one value, nothing nested
const CELL_KINDS: SettingFieldKind[] = ['text', 'number', 'date', 'select', 'color', 'toggle']

// The room a cell takes in a row, in px: free text (paths, templates, patterns) is the
// widest, a date, a name and a dropdown less, a number less again, a code, a swatch or a
// switch the least. A record whose cells fit side by side in ROW_WIDTH is a row, and each
// cell starts at this width in the row (--settings-cell-width, SettingsEditor.sass), so the
// budget and the drawn row never disagree
const CELL_WIDTH: Record<string, number> = {
  text: 200,
  date: 160,
  select: 120,
  number: 100,
  color: 48,
  toggle: 72,
}
const NAME_WIDTH = 120
// a short code (a type's short name): room for its column heading ("Short name")
const SHORT_WIDTH = 88
// A multi-select with a few options is a cell (a status's scope); one with many options
// (Applications' lists of apps) outgrows it and folds
const MULTI_SELECT_WIDTH = 160
const MULTI_SELECT_MAX_OPTIONS = 8
// a status (name, short name, state, colour, icon, scope: 656) is the widest row; anatomy
// roots (name and three paths: 720) are cards
const ROW_WIDTH = 660
const ROW_MAX_FIELDS = 6
// Past a row, a record is a card up to this many fields
const CARD_MAX_FIELDS = 8

type ListItemPresentation = 'row' | 'card' | 'fold' | 'plain'

/** What the layout of an item reads: the schema utils, and the level being edited (scope).
 * The registry has both, but is a new object on every render */
type LayoutContext = Pick<Registry, 'schemaUtils'> & { formContext: $Any }

/** Whether a text field holds a short code (a type's short name): a narrow field */
export const isShortField = (name: string, schema: $Any) =>
  schema?.widget === 'short' || name === 'shortName'

/** The room (px) a field takes as a cell of a list row, from its resolved schema (see CELL_WIDTH) */
export const getRowCellWidth = (
  name: string,
  property: $Any,
  kind: SettingFieldKind = getSettingFieldKind(property),
) => {
  if (property?.type === 'array') return MULTI_SELECT_WIDTH
  if (kind !== 'text') return CELL_WIDTH[kind]
  if (name === 'name') return NAME_WIDTH
  return isShortField(name, property) ? SHORT_WIDTH : CELL_WIDTH.text
}

/**
 * How a list of records draws its items in the flat layout. Only the fields decide, never
 * the schema's layout hint or the length of a saved value, so the same shape always looks
 * the same:
 * - `row`: up to 6 single-value fields (a multi-select with a few options counts) that fit
 *   side by side (see CELL_WIDTH) in one boxed row, labels once above the list: pairs, paths
 *   per platform, types with a colour and icon
 * - `card`: parallel values that don't fit a row (paths per platform, like roots), up to 8
 *   fields: the name on top and the values in a grid below. A grid only reads right when its
 *   values are of one kind side by side
 * - `fold`: any other record too wide for a row (unrelated values: a menu item's type, command
 *   and tooltip), anything with a list, a group, a multi-select or a code editor inside, and
 *   records of more than 8 fields: one titled line that opens to labelled rows
 * - `plain`: a single field, drawn as it is
 */
const getListItemPresentation = (schema: $Any, context: LayoutContext): ListItemFit => {
  if (schema?.type !== 'object') return { presentation: 'plain' }
  // fields out of the level being edited aren't drawn, so they take no room
  const fields = Object.entries<$Any>(schema.properties || {})
    .filter(([, property]) => isPropertyInScope(property, context.formContext))
    .map(([name, property]) => {
      const resolved = context.schemaUtils.retrieveSchema(property)
      const options =
        resolved?.type === 'array' &&
        context.schemaUtils.retrieveSchema((resolved.items || {}) as $Any).enum
      // a multi-select holds several values: a few fit a cell, many outgrow it
      const tooMany =
        resolved?.type === 'array' && !(options && options.length <= MULTI_SELECT_MAX_OPTIONS)
      const kind = tooMany ? undefined : getSettingFieldKind(resolved)
      return { name, resolved, kind }
    })
  const allSingle = fields.every(({ kind }) => !!kind && CELL_KINDS.includes(kind))
  // a record with one field showing is just that field
  if (allSingle && fields.length < 2) return { presentation: 'plain' }
  if (allSingle && fields.length <= CARD_MAX_FIELDS) {
    const width = fields.reduce(
      (sum, { name, resolved, kind }) =>
        sum + getRowCellWidth(name, resolved, kind as SettingFieldKind),
      0,
    )
    // values of one kind side by side (paths per platform) are parallel: they read as columns
    const values = fields.filter(({ name, kind }) => name !== 'name' && kind !== 'toggle')
    const parallel = values.length >= 2 && values.every(({ name }) => PLATFORM_KEYS.includes(name))
    if (fields.length <= ROW_MAX_FIELDS && width <= ROW_WIDTH) {
      return { presentation: 'row', rowWidth: width, parallel }
    }
    return { presentation: parallel ? 'card' : 'fold' }
  }
  return { presentation: isComplexListItem(schema) ? 'fold' : 'plain' }
}

type ListItemFit = {
  presentation: ListItemPresentation
  /** A row's cells side by side, in px (see CELL_WIDTH) */
  rowWidth?: number
  /** A row whose values are of one kind (paths per platform): as a card, they stay columns */
  parallel?: boolean
}

type ListItemShape = ListItemFit & {
  /** An item that wraps one group (a path mapping: `path` holding windows, linux and darwin) is
   * drawn as that group: its name and its resolved schema */
  wrapped?: { name: string; schema: $Any }
}

/**
 * The presentation of a list item, looking through a wrapper: an item whose only field is a
 * group of single values is that group's row or card, not a fold holding a group.
 */
const getListItemShape = (schema: $Any, context: LayoutContext): ListItemShape => {
  const fit = getListItemPresentation(schema, context)
  const { presentation } = fit
  if (presentation !== 'fold') return fit

  const shown = Object.entries<$Any>(schema.properties || {}).filter(([, property]) =>
    isPropertyInScope(property, context.formContext),
  )
  if (shown.length !== 1) return { presentation }
  const [name, property] = shown[0]
  const inner = context.schemaUtils.retrieveSchema(property)
  if (inner?.type !== 'object') return { presentation }
  const innerFit = getListItemPresentation(inner, context)
  return innerFit.presentation === 'row' || innerFit.presentation === 'card'
    ? { ...innerFit, wrapped: { name, schema: inner } }
    : { presentation }
}

// What a row takes besides its cells, in px: the handle and the X (24 each), the box's borders,
// and the gutters between the box and its list (12 each). See SettingsEditor.sass
const ROW_CHROME = 2 * 24 + 2 + 2 * 12

/** The width a list needs to draw this item as a row; none when it isn't a row */
export const getRowNeededWidth = (layout?: ListItemLayout) =>
  layout?.presentation === 'row' && layout.rowWidth ? layout.rowWidth + ROW_CHROME : 0

/** A row drawn where its list is too narrow for it: parallel values a card (its columns wrap),
 * others a titled line that opens, like any record too wide for a row */
export const asNarrowListItem = (layout: ListItemLayout): ListItemLayout =>
  layout.presentation === 'row'
    ? { ...layout, presentation: layout.parallel ? 'card' : 'fold' }
    : layout

// Schema types of a single value, as opposed to an object or a list
const PLAIN_TYPES = ['string', 'integer', 'number', 'boolean']

export type ListItemLayout = ListItemShape & {
  /** The item's schema, resolved against its value; none for a single value */
  itemSchema: $Any | null
  /** A single value (a path in a list of paths): one bordered field */
  simple: boolean
}

/** How one item of a list is drawn in the flat layout, from the list's item schema and its value */
export const getListItemLayout = (
  itemsSchema: $Any,
  value: unknown,
  context: LayoutContext,
): ListItemLayout => {
  const resolved: $Any = context.schemaUtils.retrieveSchema(itemsSchema, value as $Any)
  // a single value has nothing to lay out: it never folds nor becomes a row
  if (PLAIN_TYPES.includes(resolved?.type)) {
    return { presentation: 'plain', itemSchema: null, simple: true }
  }
  return {
    ...getListItemShape(resolved, context),
    itemSchema: resolved,
    simple: !['object', 'array'].includes(resolved?.type),
  }
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

// AYON keys a plugin's settings by the plugin's class name ("CameraLoader",
// "ValidateMeshUVs"); other groups of settings are snake_case
const PLUGIN_NAME = /^[A-Z](?=.*[a-z])[A-Za-z0-9]*$/

/**
 * The groups of an object that fold like list items: 4 or more groups that read as
 * records of a list, so they fold to a titled row. Either they all share one shape
 * (Applications' definitions), or most of them are plugins: most can be turned on and off
 * (an "enabled" switch), or are named after their plugin's class (Houdini's loaders: each
 * its own fields, few with a switch). They are fixed entries (no handle, X or add button).
 * All of them fold or none do, so a card never mixes boxes and sections.
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
  let pluginNamed = 0
  for (const name of names) {
    const property = schema?.properties?.[name]
    if (!property || typeof property !== 'object') continue
    const resolved: $Any = registry.schemaUtils.retrieveSchema(property, formData?.[name])
    if (resolved?.type !== 'object' || !isGroupSchema(resolved)) continue
    groups.set(name, resolved)
    shapes.add(getGroupShape(property, resolved))
    if (resolved.properties?.enabled?.type === 'boolean') switchable++
    if (PLUGIN_NAME.test(name)) pluginNamed++
  }
  if (groups.size < MIN_FOLDING_GROUPS) return new Map<string, $Any>()
  const sameShape = shapes.size === 1 && [...groups.values()].every(isComplexListItem)
  const mostPlugins = switchable > groups.size / 2 || pluginNamed > groups.size / 2
  return sameShape || mostPlugins ? groups : new Map<string, $Any>()
}
