import { $Any } from '@types'

type SettingsGroupVariant = 'sheet' | 'card' | 'subgroup'

const getSettingsGroupVariant = (depth: number): SettingsGroupVariant => {
  if (depth <= 0) return 'sheet'
  if (depth === 1) return 'card'
  return 'subgroup'
}

type SettingsGroupLayoutArgs = {
  parentDepth: number
  isRoot?: boolean
  isList?: boolean
  hasTitle: boolean
  hasSwitch: boolean
  /** set when the group is a list item that folds */
  listItem: { expanded: boolean } | null
}

/**
 * How a group is drawn in the flat layout. `body` says where its content goes: in a
 * card's box, as is, or nowhere (a folded list item). A section's fields sit in inset
 * panels, like the lists of a macOS settings pane: its form template groups them
 * (sub-groups get panels of their own, beside them, never inside). A section with an
 * on/off switch leads its first panel with it (`leadsPanel`) instead of a title above.
 */
export const getSettingsGroupLayout = ({
  parentDepth,
  isRoot,
  isList,
  hasTitle,
  hasSwitch,
  listItem,
}: SettingsGroupLayoutArgs) => {
  const depth = isRoot ? 0 : parentDepth + 1
  const variant = getSettingsGroupVariant(depth)
  const folded = !!listItem && !listItem.expanded
  // lists are not sections (their items are boxes), nor are list items (their fields go
  // in a panel under their name)
  const isSection = variant === 'subgroup' && !isList && !listItem

  let body: 'none' | 'card' | 'plain' = 'plain'
  if (folded) body = 'none'
  else if (variant === 'card') body = 'card'

  return {
    depth,
    variant,
    folded,
    isSection,
    leadsPanel: isSection && hasSwitch,
    hasHeader: hasTitle || hasSwitch || !!listItem,
    body,
  }
}

/** Whether an object in the flat layout puts its fields in panels: a card's or a section's */
export const isPanelSectionObject = ({
  layout,
  isRoot,
  isListItem,
}: {
  layout?: string
  isRoot: boolean
  isListItem: boolean
}) => !isRoot && !isListItem && !['compact', 'root', 'expanded'].includes(layout ?? '')

/**
 * Whether a (resolved) property schema renders as a group rather than a row.
 * Mirrors the branches in FieldTemplate and ObjectFieldTemplate that draw a panel.
 */
export const isGroupSchema = (schema: $Any): boolean => {
  if (!schema) return false
  if (schema.type === 'object') {
    return schema.widget !== 'access' && !['compact', 'expanded', 'root'].includes(schema.layout)
  }
  if (schema.type === 'array') {
    return schema.items?.type !== 'string' && schema.layout !== 'compact'
  }
  return false
}

// Folding list items (flat layout). Open items are stored for the browser session

export const OPEN_LIST_ITEMS_KEY = 'settings-flat-open-list-items'

// Fields that name an item (already its title) or switch it, never part of its summary
const SUMMARY_SKIPPED_FIELDS = ['name', 'label', 'enabled']

/**
 * Prefix of the stored keys for one list. Several addons, projects and sites can be
 * on screen at once with the same field ids, so the key includes all three.
 */
export const getListItemsPrefix = (formContext: $Any, arrayId: string) =>
  `${[formContext?.addonName, formContext?.headerProjectName, formContext?.headerSiteId]
    .map((part) => part ?? '')
    .join('/')}|${arrayId}|`

/**
 * Moves the open state of a list's items along with the items. `mapIndex` gives an
 * item's new index, or null when it was removed.
 */
export const remapOpenListItems = (
  openKeys: string[],
  prefix: string,
  mapIndex: (index: number) => number | null,
) =>
  openKeys.flatMap((key) => {
    if (!key.startsWith(prefix)) return [key]
    const next = mapIndex(Number(key.slice(prefix.length)))
    return next === null ? [] : [`${prefix}${next}`]
  })

/** New index of each item after the one at `from` moved to `to` */
export const reorderedIndex = (from: number, to: number) => (index: number) => {
  if (index === from) return to
  if (from < to && index > from && index <= to) return index - 1
  if (from > to && index >= to && index < from) return index + 1
  return index
}

/** New index of each item after the one at `removed` was deleted */
export const removedIndex = (removed: number) => (index: number) => {
  if (index === removed) return null
  return index > removed ? index - 1 : index
}

// a model with its own title or default is wrapped (Pydantic): allOf: [{ $ref }], and an
// optional one is anyOf: [{ $ref }, { type: 'null' }]
const SCHEMA_WRAPPERS = ['allOf', 'anyOf', 'oneOf']

const holdsObjects = (property: $Any): boolean =>
  !!property?.$ref ||
  property?.type === 'object' ||
  (property?.type === 'array' && holdsObjects(property.items)) ||
  SCHEMA_WRAPPERS.some((key) => (property?.[key] || []).some(holdsObjects))

/**
 * A list item worth folding: two or more fields (its name counts), or a field holding a
 * list, a group or a list of objects. Short items that fit a boxed row are rows instead
 * (listItemLayout), so this catches the rest, such as rows whose values are too long.
 * A single plain field reads fine open.
 */
export const isComplexListItem = (schema: $Any) => {
  const fields = Object.entries<$Any>(schema?.properties || {}).filter(([key]) => key !== 'enabled')
  return (
    fields.length >= 2 ||
    fields.some(([, property]) => property?.type === 'array' || holdsObjects(property))
  )
}

// an entry of a list of objects is shown by its label or name, if it has one
const formatSummaryEntry = (value: $Any): string => {
  if (value && typeof value === 'object') return String(value.label || value.name || '')
  return String(value ?? '')
}

const formatSummaryValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(formatSummaryEntry).filter(Boolean).join(', ')
  if (typeof value === 'number') return String(value)
  if (typeof value !== 'string') return ''
  // code and JSON (environments, scripts) don't read on one line
  const text = value.trim()
  return text.includes('\n') || /^[[{]/.test(text) ? '' : text
}

/** The first few filled-in values of an item, each as "Title: value" */
export const getListItemSummaryParts = (schema: $Any, formData: $Any, maxParts = 3) => {
  const parts: string[] = []
  for (const [key, property] of Object.entries<$Any>(schema?.properties || {})) {
    if (SUMMARY_SKIPPED_FIELDS.includes(key)) continue
    const text = formatSummaryValue(formData?.[key])
    if (!text) continue
    parts.push(`${property?.title || key}: ${text}`)
    if (parts.length >= maxParts) break
  }
  return parts
}

// Short words that stay lowercase inside a title
const MINOR_WORDS = [
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'of',
  'on',
  'or',
  'per',
  'the',
  'to',
  'vs',
  'with',
]

/**
 * Title case for section titles: each word capitalized except short linking words.
 * Only first letters change, so acronyms (USD, OCIO) and camelCase stay intact.
 */
export const toTitleCase = (text: string) =>
  text.replace(/\S+/g, (word, offset: number) => {
    if (offset > 0 && MINOR_WORDS.includes(word.toLowerCase())) return word.toLowerCase()
    return word.charAt(0).toUpperCase() + word.slice(1)
  })

/**
 * The element id of a group, the target of its outline link. Prefixed: field ids start
 * with "root", which is also the id of the app's mount element
 */
export const getSettingsGroupAnchor = (fieldId: string) => `settings-${fieldId}`
