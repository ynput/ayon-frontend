// The compact layout of the Details panel's attributes: key fields always at the top, related
// attributes merged into one summary row, and empty fields tucked away behind an expander.
import type { AttributeField } from './DetailsPanelAttributesEditor'

/** the very first rows: what the entity is called */
export const TOP_FIELDS = ['name', 'label']

/** shown right after the name, even when empty: the fields people change most */
export const HEADER_FIELDS = ['status', 'tags']

type FormValue = unknown

interface GroupDefinition {
  key: string
  label: string
  /** summarised in the group's row, and always inside the group */
  main: string[]
  /**
   * a row of their own when they have a value of their own, inside the group when empty or the same
   * as the project's (fps and handles are copied from the project to every entity)
   */
  extra: string[]
  summary: (get: (name: string) => string | undefined) => string
}

// a single frame when both ends are the same (1001, not 1001–1001)
const range = (from?: string, to?: string) =>
  from && to ? (from === to ? from : `${from}–${to}`) : from ? `from ${from}` : to ? `to ${to}` : ''

const GROUPS: GroupDefinition[] = [
  {
    key: 'name',
    label: 'Name',
    main: ['name'],
    extra: ['label'],
    summary: (get) => get('name') || '',
  },
  {
    key: 'resolution',
    label: 'Resolution',
    main: ['attrib.resolutionWidth', 'attrib.resolutionHeight'],
    extra: ['attrib.fps', 'attrib.pixelAspect'],
    summary: (get) => {
      const width = get('attrib.resolutionWidth')
      const height = get('attrib.resolutionHeight')
      return width && height
        ? `${width}×${height}`
        : width
        ? `W ${width}`
        : height
        ? `H ${height}`
        : ''
    },
  },
  {
    key: 'frames',
    label: 'Frames',
    main: ['attrib.frameStart', 'attrib.frameEnd'],
    extra: ['attrib.handleStart', 'attrib.handleEnd', 'attrib.clipIn', 'attrib.clipOut'],
    summary: (get) => range(get('attrib.frameStart'), get('attrib.frameEnd')),
  },
]

export const isEmptyFieldValue = (value: FormValue) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

/** the field has the project's value (and is not mixed), so it says nothing about this entity */
export const isProjectDefault = (
  name: string,
  form: Record<string, FormValue>,
  mixedFields: string[] = [],
  defaults: Record<string, FormValue> = {},
) =>
  !mixedFields.includes(name) &&
  !isEmptyFieldValue(form[name]) &&
  !isEmptyFieldValue(defaults[name]) &&
  String(form[name]) === String(defaults[name])

export interface AttributeGroup {
  key: string
  label: string
  fields: AttributeField[]
  summary: string
}

export type AttributeItem =
  | { type: 'field'; field: AttributeField }
  | { type: 'group'; group: AttributeGroup }

export const getItemKey = (item: AttributeItem) =>
  item.type === 'field' ? item.field.name : `group:${item.group.key}`

export const countItemFields = (items: AttributeItem[]) =>
  items.reduce((count, item) => count + (item.type === 'field' ? 1 : item.group.fields.length), 0)

/**
 * Splits the fields into those with a value and empty ones. A group's row sits where its first
 * member is and summarises its main fields; it is filled when a main field has a value. Its extra
 * fields with a value other than the project's (`defaults`, by field name) follow it as rows of
 * their own; the empty ones and those with the project's value open with the group. A group with
 * no main field present, or with one field only, stays as plain fields.
 *
 * A mixed value counts as a value, and a checkbox is never empty: unchecked is an answer too, and
 * it's ticked right in its row.
 */
export const buildAttributeItems = (
  fields: AttributeField[],
  form: Record<string, FormValue>,
  mixedFields: string[] = [],
  defaults: Record<string, FormValue> = {},
): { filled: AttributeItem[]; empty: AttributeItem[] } => {
  const byName = new Map(fields.map((field) => [field.name, field]))
  const isFilled = (name: string) =>
    byName.get(name)?.data.type === 'boolean' ||
    mixedFields.includes(name) ||
    !isEmptyFieldValue(form[name])
  const present = (names: string[]) =>
    names.map((name) => byName.get(name)).filter((field): field is AttributeField => !!field)

  const groupOf = new Map<
    string,
    { group: AttributeGroup; isFilled: boolean; own: AttributeField[] }
  >()
  for (const definition of GROUPS) {
    const main = present(definition.main)
    const extra = present(definition.extra)
    const own = extra.filter(
      (field) => isFilled(field.name) && !isProjectDefault(field.name, form, mixedFields, defaults),
    )
    const members = [...main, ...extra.filter((field) => !own.includes(field))]
    if (!main.length || members.length < 2) continue

    const get = (name: string) => {
      if (!byName.has(name)) return undefined
      if (mixedFields.includes(name)) return 'mixed'
      const value = form[name]
      return isEmptyFieldValue(value) ? undefined : String(value)
    }
    const entry = {
      group: {
        key: definition.key,
        label: definition.label,
        fields: members,
        summary: definition.summary(get),
      },
      isFilled: main.some((field) => isFilled(field.name)),
      own,
    }
    ;[...main, ...extra].forEach((field) => groupOf.set(field.name, entry))
  }

  const filled: AttributeItem[] = []
  const empty: AttributeItem[] = []
  const placed = new Set<string>()
  for (const field of fields) {
    const entry = groupOf.get(field.name)
    if (entry) {
      if (placed.has(entry.group.key)) continue
      placed.add(entry.group.key)
      ;(entry.isFilled ? filled : empty).push({ type: 'group', group: entry.group })
      entry.own.forEach((extra) => filled.push({ type: 'field', field: extra }))
    } else {
      ;(isFilled(field.name) ? filled : empty).push({ type: 'field', field })
    }
  }

  return { filled, empty }
}
