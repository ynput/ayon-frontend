import clsx from 'clsx'
import { CSSProperties, ReactNode } from 'react'
import { ObjectFieldTemplateProps } from '@rjsf/utils'
import { $Any } from '@types'
import { SettingsGroup } from '../SettingsGroup/SettingsGroup'
import { isGroupSchema, isPlatformGroup } from '../SettingsGroup/SettingsGroupHelpers'
import { getFoldingGroupNames, getRowCellWidth, isShortField } from './listItemLayout'
import SettingsFoldingGroup from './SettingsFoldingGroup'
import SearchHidden from './SearchHidden'
import {
  ObjectFieldElement,
  ObjectFieldsMode,
  getCardCells,
  getHiddenFieldNames,
  getObjectFieldsLayout,
  getVisibleFields,
  orderPlainFields,
  segmentFields,
} from './ObjectFieldsHelpers'

type RenderField = (element: ObjectFieldElement) => JSX.Element

type ObjectFieldItemProps = {
  element: ObjectFieldElement
  /** In a list row: the room the cell starts with (getRowCellWidth) */
  cellWidth?: number
  /** A group that folds like a list item: its resolved schema */
  foldingGroup?: $Any
  formContext: $Any
  parentId: string
  formData: $Any
}

/** One field of an object, classed by its widget (narrow fields), or a group that folds */
const ObjectFieldItem = ({
  element,
  cellWidth,
  foldingGroup,
  formContext,
  parentId,
  formData,
}: ObjectFieldItemProps) => {
  const fieldSchema = element.content.props?.schema
  const widget = fieldSchema?.widget || (isShortField(element.name, fieldSchema) ? 'short' : null)
  return (
    <div
      className={clsx(
        'form-object-field-item',
        widget && `widget-${widget}`,
        foldingGroup && 'settings-folding-group',
      )}
      style={
        cellWidth ? ({ '--settings-cell-width': `${cellWidth}px` } as CSSProperties) : undefined
      }
    >
      {foldingGroup ? (
        <SettingsFoldingGroup
          formContext={formContext}
          parentId={parentId}
          name={element.name}
          schema={foldingGroup}
          formData={formData?.[element.name]}
        >
          {element.content}
        </SettingsFoldingGroup>
      ) : (
        element.content
      )}
    </div>
  )
}

type Segments = (ObjectFieldElement | ObjectFieldElement[])[]

/** The form root's fields: each group a card, the loose fields between groups a card of their own */
const SheetFields = ({
  segments,
  renderField,
}: {
  segments: Segments
  renderField: RenderField
}) => (
  <>
    {segments.map((segment) =>
      Array.isArray(segment) ? (
        <SettingsGroup key={`loose-${segment[0].name}`}>
          <div className="form-object-field settings-panel">{segment.map(renderField)}</div>
        </SettingsGroup>
      ) : (
        renderField(segment)
      ),
    )}
  </>
)

type PanelFieldsProps = {
  segments: Segments
  renderField: RenderField
  /** The section's title row, which leads its first panel */
  lead?: ReactNode
  /** Per-platform values (a path mapping): one row, a column each */
  platformRow: boolean
}

/** A card's or section's fields: the loose fields in inset panels, between its sub-groups */
const PanelFields = ({ segments, renderField, lead, platformRow }: PanelFieldsProps) => {
  const panels = lead && !Array.isArray(segments[0]) ? [[], ...segments] : segments
  return (
    <>
      {panels.map((segment, index) =>
        Array.isArray(segment) ? (
          <div
            key={`panel-${segment[0]?.name ?? 'lead'}`}
            className={clsx(
              'form-object-field settings-panel',
              index === 0 && !!lead && 'settings-panel-lead',
              !lead && platformRow && 'layout-compact',
            )}
          >
            {index === 0 && lead}
            {segment.map(renderField)}
          </div>
        ) : (
          renderField(segment)
        ),
      )}
    </>
  )
}

type PlainFieldsProps = {
  fields: ObjectFieldElement[]
  renderField: RenderField
  /** An open list item: it leads with its first field and keeps the rest in a panel */
  leadsListItem: boolean
}

const PlainFields = ({ fields, renderField, leadsListItem }: PlainFieldsProps) => {
  const items = fields.map(renderField)
  if (!leadsListItem || items.length < 2) return <>{items}</>
  return (
    <>
      {items[0]}
      <div className="form-object-field settings-panel">{items.slice(1)}</div>
    </>
  )
}

type ExpandedFieldsProps = {
  properties: ObjectFieldElement[]
  hidden: Set<string>
  className: string
  longDescription: ReactNode
}

/** Classic "expanded" layout: the name in a column beside the other fields */
const ExpandedFields = ({
  properties,
  hidden,
  className,
  longDescription,
}: ExpandedFieldsProps) => {
  const nameField = properties.find((element) => element?.name === 'name')?.content ?? null
  const otherFields = properties
    .filter((element) => element?.name !== 'name' && !hidden.has(element.name))
    .map((element) => element.content)
  return (
    <div style={{ width: '100%' }}>
      {longDescription}
      <div className={className}>
        <div className="name-field">{nameField}</div>
        <div className="data-fields">{otherFields}</div>
      </div>
    </div>
  )
}

export type ObjectFieldsProps = Pick<
  ObjectFieldTemplateProps,
  'properties' | 'schema' | 'formContext' | 'formData' | 'registry' | 'idSchema'
> & {
  id: string
  className: string
  mode: ObjectFieldsMode
  flatLayout: boolean
  /** An open list item in the flat layout: it leads with its first field */
  leadsListItem: boolean
  /** The field a list item is titled by (name, label or title): it leads */
  leadField?: string
  longDescription: ReactNode
  /** Whether the object matches the settings search */
  matches: boolean
  /** A section's title row, when it leads its first panel (SettingsGroup) */
  lead?: ReactNode
}

/** The fields of an object, laid out by its mode (see ObjectFieldsMode) and layout */
export const ObjectFields = ({
  properties,
  schema,
  formContext,
  formData,
  registry,
  idSchema,
  id,
  className,
  mode,
  flatLayout,
  leadsListItem,
  leadField,
  longDescription,
  matches,
  lead,
}: ObjectFieldsProps) => {
  const hidden = getHiddenFieldNames(schema, formContext, formData)
  const visible = getVisibleFields(properties, schema, hidden)
  const layout = getObjectFieldsLayout(schema, flatLayout, visible.length)
  const isCard = flatLayout && schema.listLayout === 'card'
  // a card's columns: how many values share its lines (SettingsEditor.sass)
  const layoutClassName = clsx(
    className,
    layout && `layout-${layout}`,
    isCard && ['layout-card', `card-cells-${getCardCells(visible)}`],
  )

  if (layout === 'expanded') {
    return (
      <ExpandedFields
        properties={properties}
        hidden={hidden}
        className={layoutClassName}
        longDescription={longDescription}
      />
    )
  }

  // groups among 4+ of the same shape fold like list items; they sit in panels as rows
  const foldingGroups =
    mode === 'panels'
      ? getFoldingGroupNames(
          schema,
          registry,
          formData,
          visible.map((element) => element.name),
        )
      : new Map<string, $Any>()
  // the cells of a list row start at the room the row's layout gave them
  const isListRow = flatLayout && schema.listLayout === 'row'

  const renderField: RenderField = (element) => (
    <ObjectFieldItem
      key={element.name}
      element={element}
      cellWidth={
        isListRow
          ? getRowCellWidth(
              element.name,
              registry.schemaUtils.retrieveSchema(
                (schema.properties?.[element.name] ?? {}) as $Any,
              ),
            )
          : undefined
      }
      foldingGroup={foldingGroups.get(element.name)}
      formContext={formContext}
      parentId={idSchema.$id}
      formData={formData}
    />
  )

  // a group gets a card on the sheet (any group) or sits between the panels (an object)
  const isGroupField = (name: string) => {
    if (foldingGroups.has(name)) return false
    const propertySchema = schema.properties?.[name]
    if (!propertySchema || typeof propertySchema !== 'object') return false
    const resolved = registry.schemaUtils.retrieveSchema(propertySchema, formData?.[name])
    return isGroupSchema(resolved) && (mode === 'sheet' || resolved.type === 'object')
  }

  let content: ReactNode
  if (mode === 'sheet') {
    content = (
      <SheetFields segments={segmentFields(visible, isGroupField)} renderField={renderField} />
    )
  } else if (mode === 'panels') {
    content = (
      <PanelFields
        segments={segmentFields(visible, isGroupField)}
        renderField={renderField}
        lead={lead}
        platformRow={isPlatformGroup(schema)}
      />
    )
  } else {
    content = (
      <PlainFields
        fields={orderPlainFields(visible, { schema, layout, flatLayout, leadField })}
        renderField={renderField}
        leadsListItem={leadsListItem}
      />
    )
  }

  return (
    <SearchHidden matches={matches}>
      {longDescription}
      <div
        className={clsx(layoutClassName, mode === 'sheet' && 'settings-sheet-items')}
        data-test="test-aa"
        data-fieldid={id}
      >
        {content}
      </div>
    </SearchHidden>
  )
}
