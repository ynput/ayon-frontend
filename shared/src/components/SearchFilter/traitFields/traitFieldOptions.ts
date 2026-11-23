import type { Filter, FilterValue, Option } from '@ynput/ayon-react-components'
import type { TraitFieldInfo, TraitUsage } from '@shared/api/generated/traits'

// Filter options for representation trait fields. The server keeps the short scalar fields of each
// trait in an indexed column. A filter key is `traits/<versionless trait id>/<field>` in the
// representation scope; it matches every version of the trait that has the field.

export const TRAIT_FIELD_KEY_PREFIX = 'traits/'
export const TRAIT_IDS_KEY = 'traitIds'

type TraitFieldType =
  | 'integer'
  | 'float'
  | 'string'
  | 'boolean'
  | 'list_of_strings'
  | 'list_of_integers'

// a field of a trait used in the project
export type TraitFieldRef = {
  traitId: string
  traitName: string
  field: TraitFieldInfo
}

export const getTraitFieldKey = (traitId: string, field: string) =>
  `${TRAIT_FIELD_KEY_PREFIX}${traitId}/${field}`

export const getTraitFieldOptionId = (traitId: string, field: string, scope = 'representation') =>
  `${scope}_${getTraitFieldKey(traitId, field)}`

export const getTraitIdsOptionId = (scope = 'representation') => `${scope}_${TRAIT_IDS_KEY}`

// Same format as `buildFilterId` of ayon-react-components (`<option id>__<unique suffix>`), kept
// local so this module has no runtime dependency on the component library (unit tests run in node).
let nextFilterId = 0
const buildFilterId = (optionId: string) =>
  `${optionId}__trait-${Date.now().toString(36)}-${++nextFilterId}`

export const flattenTraitFields = (traits: TraitUsage[]): TraitFieldRef[] =>
  traits.flatMap((trait) =>
    (trait.fields || []).map((field) => ({ traitId: trait.id, traitName: trait.name, field })),
  )

const getFieldIcon = (type: string) => {
  if (type === 'boolean') return 'radio_button_checked'
  if (type === 'integer' || type === 'float') return 'pin'
  if (type.startsWith('list_of')) return 'format_list_bulleted'
  return 'text_fields'
}

// "PixelBased: Display Window Width"
export const getTraitFieldLabel = ({
  traitName,
  field,
}: Pick<TraitFieldRef, 'traitName' | 'field'>) => `${traitName}: ${field.title}`

const formatValueLabel = (value: unknown) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export const traitFieldValuesToFilterValues = (
  values: { value: unknown; count?: number }[],
): FilterValue[] =>
  values
    .filter(({ value }) => value !== null && value !== undefined)
    .map(({ value }) => ({ id: String(value), label: formatValueLabel(value) }))

type BuildTraitFieldOptionsConfig = {
  scope?: string
  enableExcludes?: boolean
  enableRelativeValues?: boolean
  // loads the most frequent values of a field, called when the option is opened
  loadFieldValues?: (traitId: string, field: string) => Promise<FilterValue[]>
  loadValuesKey?: string
}

const representationGroup = {
  name: 'representation',
  label: 'Representation',
  icon: 'layers',
}

export const buildTraitFieldOptions = (
  fields: TraitFieldRef[],
  config: BuildTraitFieldOptionsConfig = {},
): Option[] =>
  fields.map((ref) => {
    const { traitId, field } = ref
    const type = field.type as TraitFieldType
    const isBoolean = type === 'boolean'
    const isList = type.startsWith('list_of')
    const label = getTraitFieldLabel(ref)

    const values: Option[] = isBoolean
      ? [
          { id: 'true', label: 'Yes', values: [] },
          { id: 'false', label: 'No', values: [] },
        ]
      : (field.enum || []).map((value) => ({
          id: String(value),
          label: formatValueLabel(value),
          values: [],
        }))

    const option: Option = {
      id: getTraitFieldOptionId(traitId, field.name, config.scope),
      type,
      label,
      icon: getFieldIcon(type),
      operator: 'OR',
      inverted: false,
      values,
      allowsCustomValues: !isBoolean && !field.enum?.length,
      // empty values are not stored, so "no value" means the representation lacks the field
      allowHasValue: !isBoolean && config.enableRelativeValues,
      allowNoValue: !isBoolean && config.enableRelativeValues,
      allowExcludes: config.enableExcludes,
      operatorChangeable: isList,
      singleSelect: isBoolean,
      group: representationGroup,
      tooltip: [label, field.description, traitId].filter(Boolean).join('\n'),
      value: { icon: representationGroup.icon },
      searchLabel: [label, `${ref.traitName}:${field.name}`, ...(field.synonyms || [])].join(' '),
    }

    if (!isBoolean && !field.enum?.length && config.loadFieldValues) {
      const loadFieldValues = config.loadFieldValues
      option.loadValues = () => loadFieldValues(traitId, field.name)
      option.loadValuesKey = config.loadValuesKey
    }
    return option
  })

export const buildTraitIdsOption = (
  traits: TraitUsage[],
  config: Pick<BuildTraitFieldOptionsConfig, 'scope' | 'enableExcludes'> = {},
): Option | null => {
  if (!traits.length) return null
  return {
    id: getTraitIdsOptionId(config.scope),
    type: 'list_of_strings',
    label: 'Has Trait',
    icon: 'extension',
    operator: 'AND',
    inverted: false,
    values: traits.map((trait) => ({
      id: trait.id,
      label: trait.name,
      values: [],
    })),
    allowsCustomValues: false,
    allowExcludes: config.enableExcludes,
    operatorChangeable: true,
    group: representationGroup,
    tooltip: 'Representations carrying the selected traits',
    value: { icon: representationGroup.icon },
    searchLabel: 'Has Trait traits',
  }
}

//
// Typed syntax: `<name> <op> <value>`, e.g. `PixelBased:width = 1920` or
// `ColorManaged:Color Space != ACEScg, sRGB`
//

export type ParsedTraitFieldExpression = {
  ref: TraitFieldRef
  operator: '=' | '!='
  values: (string | number | boolean)[]
}

export type TraitFieldParseResult =
  | { ok: true; expression: ParsedTraitFieldExpression }
  | { ok: false; error: string; candidates?: TraitFieldRef[] }

// lowercase and remove everything except letters and digits
export const normalizeFieldName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

const EXPRESSION_REGEX = /^\s*(.+?)\s*(!=|=)\s*(.+?)\s*$/

// Splits `a, "b, c", d` by commas outside of quotes. Quoted parts keep their quotes.
const splitValues = (text: string): string[] => {
  const values: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (char === '\\' && quoted && index + 1 < text.length) {
      current += char + text[++index]
    } else if (char === '"') {
      quoted = !quoted
      current += char
    } else if (char === ',' && !quoted) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())
  return values.filter(Boolean)
}

const convertValue = (raw: string, field: TraitFieldInfo): string | number | boolean | null => {
  const quoted = raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')
  const text = quoted ? raw.slice(1, -1).replace(/\\(.)/g, '$1') : raw.trim()
  switch (field.type) {
    case 'integer':
    case 'list_of_integers':
      return /^[+-]?\d+$/.test(text) ? parseInt(text, 10) : null
    case 'float':
      return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(text) ? parseFloat(text) : null
    case 'boolean': {
      const lower = text.toLowerCase()
      if (['true', 'yes', '1'].includes(lower)) return true
      if (['false', 'no', '0'].includes(lower)) return false
      return null
    }
    default: {
      if (!text) return null
      if (field.enum?.length) {
        // enum values are matched case-insensitively
        const match = field.enum.find((value) => String(value).toLowerCase() === text.toLowerCase())
        return match === undefined ? null : String(match)
      }
      return text
    }
  }
}

const fieldNames = (field: TraitFieldInfo) => [field.name, field.title]

// Finds trait fields by a typed name, in this order:
// 1. `<trait>:<field>`, trait by name or id, field by name or title
// 2. a synonym from the studio settings
// 3. `<field>` alone, by name or title
export const findTraitFields = (name: string, fields: TraitFieldRef[]): TraitFieldRef[] => {
  const normalized = normalizeFieldName(name)
  if (!normalized) return []

  const byTraitAndField = fields.filter(({ traitId, traitName, field }) =>
    [traitName, traitId].some((trait) =>
      fieldNames(field).some(
        (fieldName) => normalizeFieldName(`${trait}:${fieldName}`) === normalized,
      ),
    ),
  )
  if (byTraitAndField.length) return byTraitAndField

  const bySynonym = fields.filter(({ field }) =>
    (field.synonyms || []).some((synonym) => normalizeFieldName(synonym) === normalized),
  )
  if (bySynonym.length) return bySynonym

  return fields.filter(({ field }) =>
    fieldNames(field).some((fieldName) => normalizeFieldName(fieldName) === normalized),
  )
}

export const parseTraitFieldExpression = (
  text: string,
  fields: TraitFieldRef[],
): TraitFieldParseResult => {
  const match = text.match(EXPRESSION_REGEX)
  if (!match) return { ok: false, error: 'Use <name> = <value> or <name> != <value>' }
  const [, name, operator, rawValues] = match

  const found = findTraitFields(name, fields)
  if (!found.length) return { ok: false, error: `Unknown filter "${name}"` }
  if (found.length > 1) {
    return { ok: false, error: `"${name}" matches several filters`, candidates: found }
  }
  const ref = found[0]

  const values: (string | number | boolean)[] = []
  for (const raw of splitValues(rawValues)) {
    const value = convertValue(raw, ref.field)
    if (value === null) {
      const allowed = ref.field.enum?.length ? ` (one of ${ref.field.enum.join(', ')})` : ''
      return {
        ok: false,
        error: `"${raw}" is not a valid ${ref.field.type.replace(
          /_/g,
          ' ',
        )} for ${getTraitFieldLabel(ref)}${allowed}`,
      }
    }
    if (!values.includes(value)) values.push(value)
  }
  if (!values.length) return { ok: false, error: `Missing value for ${getTraitFieldLabel(ref)}` }

  return { ok: true, expression: { ref, operator: operator as '=' | '!=', values } }
}

// Builds a filter chip for a parsed expression. Typed values are exact (not partial `like`
// matches), so they are not marked as custom values.
export const expressionToFilters = (
  expression: ParsedTraitFieldExpression,
  scope = 'representation',
): Filter[] => {
  const { ref, operator, values } = expression
  const optionId = getTraitFieldOptionId(ref.traitId, ref.field.name, scope)
  const filterId = buildFilterId(optionId)
  const isList = ref.field.type.startsWith('list_of')
  return [
    {
      id: filterId,
      type: ref.field.type as Filter['type'],
      label: getTraitFieldLabel(ref),
      inverted: operator === '!=',
      // `a, b` on a list field means any of them, like on scalar fields
      operator: isList ? 'OR' : undefined,
      singleSelect: ref.field.type === 'boolean',
      values: values.map((value) => ({
        id: String(value),
        label: formatValueLabel(value),
        parentId: filterId,
      })),
    },
  ]
}

export const candidateLabel = (ref: TraitFieldRef) => `${ref.traitName}:${ref.field.name}`
