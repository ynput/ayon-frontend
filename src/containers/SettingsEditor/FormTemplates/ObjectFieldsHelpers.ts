import { ObjectFieldTemplateProps } from '@rjsf/utils'
import { $Any } from '@types'
import { isInlineObjectLayout, isPropertyInScope } from '../SettingsGroup/SettingsGroupHelpers'
import { resolveFlatObjectLayout } from '../SettingField'

export type ObjectFieldElement = ObjectFieldTemplateProps['properties'][number]

/**
 * How an object lays out its fields:
 * - `sheet`: the form root in the flat layout; its loose fields get cards of their own
 * - `panels`: a card or section in the flat layout; its fields sit in inset panels, between
 *   its sub-groups
 * - `plain`: everything else (classic, list items, inline layouts): the fields in order
 */
export type ObjectFieldsMode = 'sheet' | 'panels' | 'plain'

/** Fields not drawn: out of the level being edited, or options of a conditional enum that
 * aren't selected */
export const getHiddenFieldNames = (
  schema: ObjectFieldTemplateProps['schema'],
  formContext: $Any,
  formData: $Any,
) => {
  const hidden = new Set<string>()
  for (const propName in schema?.properties || {}) {
    const property: $Any = schema.properties?.[propName]
    if (!isPropertyInScope(property, formContext)) hidden.add(propName)

    if (property.conditionalEnum) {
      const value = formData?.[propName]
      const isMultiselect = Array.isArray(value) || !!property?.items?.enum
      const options: $Any[] = (isMultiselect ? property?.items?.enum : property?.enum) || []
      const selected = new Set<$Any>(isMultiselect ? value || [] : [value])
      for (const option of options) {
        if (!selected.has(option)) hidden.add(option)
      }
    }
  }
  return hidden
}

/** The fields drawn, in schema order. An object's "enabled" switch sits in its title row,
 * unless the object is drawn inline (no title) */
export const getVisibleFields = (
  properties: ObjectFieldElement[],
  schema: ObjectFieldTemplateProps['schema'],
  hidden: Set<string>,
) =>
  properties.filter(
    (element) =>
      (element.name !== 'enabled' || isInlineObjectLayout(schema.layout)) &&
      !hidden.has(element.name),
  )

/** The layout an object's fields get. In the flat layout a list row or card (listLayout, see
 * getListItemLayout) keeps the compact layout past the three fields a plain compact object
 * holds; a card wraps its values into a grid */
export const getObjectFieldsLayout = (
  schema: ObjectFieldTemplateProps['schema'],
  flatLayout: boolean,
  visibleCount: number,
): string | undefined => {
  if (!flatLayout) return schema.layout
  if (schema.listLayout) return 'compact'
  return resolveFlatObjectLayout(schema.layout, visibleCount)
}

/** Whether a field is a switch: switches sit at the end of a row of fields, or (in a card) on
 * rows of their own */
export const isSwitchField = (element: ObjectFieldElement) =>
  element.content.props?.schema?.type === 'boolean'

/** Fields of a plain object in order: a list item's title field (name, label or title) or a
 * card's name first, and in a row of fields side by side (boxed list rows) the switches last */
export const orderPlainFields = (
  fields: ObjectFieldElement[],
  {
    schema,
    layout,
    flatLayout,
    leadField,
  }: {
    schema: ObjectFieldTemplateProps['schema']
    layout?: string
    flatLayout: boolean
    leadField?: string
  },
) => {
  const lead =
    leadField ?? (schema.layout === 'expanded' || schema.listLayout === 'card' ? 'name' : null)
  const namedFirst = lead
    ? [
        ...fields.filter((element) => element.name === lead),
        ...fields.filter((element) => element.name !== lead),
      ]
    : fields
  if (!flatLayout || layout !== 'compact') return namedFirst
  return [
    ...namedFirst.filter((element) => !isSwitchField(element)),
    ...namedFirst.filter(isSwitchField),
  ]
}

/** The values of a card that share its lines: all but its name and its switches (switches have
 * rows of their own), at most 8 */
export const getCardCells = (fields: ObjectFieldElement[]) =>
  Math.max(1, fields.filter((element) => element.name !== 'name' && !isSwitchField(element)).length)

/** Fields split into runs: each group on its own, and the loose fields between groups together
 * (a run becomes a panel, or on the sheet a card) */
export const segmentFields = (
  fields: ObjectFieldElement[],
  isGroup: (name: string) => boolean,
): (ObjectFieldElement | ObjectFieldElement[])[] => {
  const segments: (ObjectFieldElement | ObjectFieldElement[])[] = []
  for (const element of fields) {
    const last = segments[segments.length - 1]
    if (isGroup(element.name)) segments.push(element)
    else if (Array.isArray(last)) last.push(element)
    else segments.push([element])
  }
  return segments
}
