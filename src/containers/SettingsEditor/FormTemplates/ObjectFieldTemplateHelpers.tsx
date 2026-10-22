import clsx from 'clsx'
import { ObjectFieldTemplateProps } from '@rjsf/utils'
import { ReactNode } from 'react'
import { toast } from 'react-toastify'
import { $Any } from '@types'
import { Badge, BadgeWrapper } from '@shared/components'
import { copyToClipboard } from '@shared/util'
import { matchesFilterKeys } from './searchMatcher'
import { SettingsGroup } from '../SettingsGroup/SettingsGroup'
import { isGroupSchema } from '../SettingsGroup/SettingsGroupHelpers'
import { resolveFlatObjectLayout } from '../SettingField/SettingFieldHelpers'
import { getFoldingGroupNames } from './listItemLayout'
import SettingsFoldingGroup from './SettingsFoldingGroup'
import ReactMarkdown from 'react-markdown'
import type { MouseEvent } from 'react'
import type { ContextMenuItemType } from '@shared/containers/ContextMenu'

const arrayStartsWith = (arr1: $Any, arr2: $Any) => {
  if ((arr2 || []).length > (arr1 || []).length) return false
  if ((arr2 || []).length === 0) return true
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

export const getObjectOverrideLevel = (
  changedKeys: ObjectFieldTemplateProps['formContext']['changedKeys'],
  overrides: ObjectFieldTemplateProps['formContext']['overrides'],
  path?: $Any[],
) => {
  for (const changedPath of changedKeys) {
    if (arrayStartsWith(changedPath, path)) return 'edit'
  }

  for (const changedId in overrides) {
    const changedPath = overrides[changedId].path
    if (arrayStartsWith(changedPath, path)) return overrides[changedId].level
  }

  return 'default'
}

export const buildLongDescription = (description?: string) =>
  description ? (
    <div className="form-object-field-help">
      <ReactMarkdown>{description}</ReactMarkdown>
    </div>
  ) : null

export const getEnabledToggler = (
  properties: ObjectFieldTemplateProps['properties'],
): ReactNode => {
  const enabledProperty = properties.find((element) => element?.name === 'enabled')
  return enabledProperty ? (
    <span className="form-object-header-enabled-toggler">{enabledProperty.content}</span>
  ) : undefined
}

export const showObjectContextMenu = (
  event: $Any,
  onSetBreadcrumbs: ObjectFieldTemplateProps['formContext']['onSetBreadcrumbs'],
  path: $Any[] | undefined,
  contextMenuModel: ContextMenuItemType[],
  contextMenu: (event: MouseEvent, model?: ContextMenuItemType[]) => void,
) => {
  onSetBreadcrumbs?.(path || [])
  if (!contextMenuModel.length) return
  event.preventDefault()
  contextMenu(event, contextMenuModel)
}

type ObjectTitleArgs = {
  title: ReactNode
  schema: ObjectFieldTemplateProps['schema']
  formData: ObjectFieldTemplateProps['formData']
  objectId: string
  formTitle?: string
  headerProjectName?: string
  headerSiteId?: string
  headerVariant?: string
  listItem?: { named: boolean; fallbackTitle: ReactNode } | null
}

export const buildObjectTitle = ({
  title,
  schema,
  formData,
  objectId,
  formTitle,
  headerProjectName,
  headerSiteId,
  headerVariant,
  listItem,
}: ObjectTitleArgs) => {
  let stringTitle = title
  if ('name' in (schema.properties || {})) {
    const label = 'label' in (schema.properties || {}) ? formData?.label : null
    stringTitle = label || formData?.name || <span className="new-object">Unnamed item</span>
  }

  if (objectId === 'root' && formTitle) stringTitle = formTitle

  let titleComponent = stringTitle
  if (objectId === 'root') {
    const envColor =
      headerVariant && ['production', 'staging'].includes(headerVariant)
        ? headerVariant
        : 'developer'
    titleComponent = (
      <>
        {stringTitle}
        <BadgeWrapper>
          {headerProjectName && <Badge color="project" label={headerProjectName} />}
          {headerSiteId && <Badge color="site" label={headerSiteId} />}
          {headerVariant && <Badge color={envColor} label={headerVariant} />}
        </BadgeWrapper>
      </>
    )
  }

  return listItem && !listItem.named ? listItem.fallbackTitle : titleComponent
}

type ObjectContextMenuArgs = {
  objectId: string
  level: string
  onRemoveAllOverrides?: () => void
  onPinOverride?: (path: $Any[]) => void
  onRemoveOverride?: (path: $Any[]) => void
  onPasteValue?: (path: $Any[]) => void
  formData: ObjectFieldTemplateProps['formData']
  override?: $Any
  overrideLevel: string
  path?: $Any[]
}

export const buildObjectContextMenu = ({
  objectId,
  level,
  onRemoveAllOverrides,
  onPinOverride,
  onRemoveOverride,
  onPasteValue,
  formData,
  override,
  overrideLevel,
  path,
}: ObjectContextMenuArgs) => {
  const model = []

  if (objectId === 'root') {
    model.push({
      label: `Remove all ${level} overrides`,
      disabled: !onRemoveAllOverrides,
      command: () => onRemoveAllOverrides?.(),
    })
  } else {
    const rmPath = override?.inGroup || path || ['root']
    if (onPinOverride) {
      model.push({
        label: `Add current ${rmPath[rmPath.length - 1]} value as ${level} override`,
        command: () => onPinOverride(rmPath),
        disabled: overrideLevel === level,
      })
    }
    if (onRemoveOverride) {
      model.push({
        label: `Remove ${level} override from ${rmPath[rmPath.length - 1]}`,
        command: () => onRemoveOverride(rmPath),
        disabled: overrideLevel !== level,
      })
    }
  }

  model.push(
    {
      label: 'Copy',
      command: () => {
        if (!formData || (Array.isArray(formData) && formData.length === 0)) {
          toast.warn('No data to copy')
          return
        }
        copyToClipboard(JSON.stringify(formData, null, 2))
      },
    },
    {
      label: 'Paste',
      disabled: !onPasteValue,
      command: () => onPasteValue?.(path || []),
    },
  )
  return model
}

type ObjectFieldsArgs = {
  properties: ObjectFieldTemplateProps['properties']
  schema: ObjectFieldTemplateProps['schema']
  formContext: ObjectFieldTemplateProps['formContext']
  formData: ObjectFieldTemplateProps['formData']
  registry: ObjectFieldTemplateProps['registry']
  idSchema: ObjectFieldTemplateProps['idSchema']
  id: string
  className: string
  wrapsLooseFields: boolean
  panelsFields: boolean
  flatLayout: boolean
  leadsListItem: boolean
  namedListItem: boolean
  longDescription: ReactNode
}

export const buildObjectFields = ({
  properties,
  schema,
  formContext,
  formData,
  registry,
  idSchema,
  id,
  className,
  wrapsLooseFields,
  panelsFields,
  flatLayout,
  leadsListItem,
  namedListItem,
  longDescription,
}: ObjectFieldsArgs) => {
  const hiddenFieldNames = new Set<$Any>()
  for (const propName in schema?.properties || {}) {
    const property: $Any = schema.properties?.[propName]
    const validScopes = new Set(property?.scope || ['studio', 'project'])
    if (validScopes.has('studio') && formContext.includeStudioScope && !validScopes.has('site')) {
      validScopes.add('project')
    }

    if (!validScopes.has(formContext.level)) hiddenFieldNames.add(propName)

    if (property.conditionalEnum) {
      const value = formData?.[propName]
      const isMultiselect = Array.isArray(value) || !!property?.items?.enum
      const options: $Any[] = (isMultiselect ? property?.items?.enum : property?.enum) || []
      const selected: $Any[] = isMultiselect ? value || [] : [value]
      const selectedValues = new Set(selected)
      for (const option of options) {
        if (!selectedValues.has(option)) hiddenFieldNames.add(option)
      }
    }
  }

  const visibleProperties = properties.filter(
    (element) =>
      (element.name !== 'enabled' || ['compact', 'root', 'expanded'].includes(schema.layout)) &&
      !hiddenFieldNames.has(element.name),
  )
  const layout = flatLayout
    ? resolveFlatObjectLayout(schema.layout, visibleProperties.length)
    : schema.layout
  const layoutClassName = clsx(className, layout && `layout-${layout}`)

  if (layout === 'expanded') {
    let nameField = null
    const otherFields = []
    for (const element of properties) {
      if (element?.name === 'name') nameField = element.content
      else if (!hiddenFieldNames.has(element.name)) otherFields.push(element.content)
    }
    const expandedFields = (
      <div style={{ width: '100%' }}>
        {longDescription}
        <div className={layoutClassName}>
          <div className="name-field">{nameField}</div>
          <div className="data-fields">{otherFields}</div>
        </div>
      </div>
    )
    return function renderExpandedFields() {
      return expandedFields
    }
  }

  const matches = matchesFilterKeys(
    formContext.searchText,
    formContext.filterKeys,
    formContext.addonName,
    idSchema.$id,
  )
  // groups among 4+ of the same shape fold like list items; they sit in panels as rows
  const foldingGroups =
    panelsFields && !leadsListItem
      ? getFoldingGroupNames(
          schema,
          registry,
          formData,
          visibleProperties.map((element) => element.name),
        )
      : new Map<string, $Any>()

  const renderItem = (element: (typeof visibleProperties)[number]) => {
    let widget = element.content.props?.schema?.widget
    widget = widget || (element.content.props?.name === 'shortName' ? 'short' : null)
    const folds = foldingGroups.has(element.name)
    return (
      <div
        key={element.name}
        className={clsx(
          'form-object-field-item',
          widget && `widget-${widget}`,
          folds && 'settings-folding-group',
        )}
      >
        {folds ? (
          <SettingsFoldingGroup
            formContext={formContext}
            parentId={idSchema.$id}
            name={element.name}
            schema={foldingGroups.get(element.name)}
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

  const leadsWithName = schema.layout === 'expanded' || namedListItem
  const namedFirst = leadsWithName
    ? [
        ...visibleProperties.filter((element) => element.name === 'name'),
        ...visibleProperties.filter((element) => element.name !== 'name'),
      ]
    : visibleProperties
  // switches always sit at the end of their row: in a row of fields side by side (boxed
  // list rows), they are the last cells
  const isSwitch = (element: (typeof visibleProperties)[number]) =>
    element.content.props?.schema?.type === 'boolean'
  const orderedProperties =
    flatLayout && layout === 'compact'
      ? [...namedFirst.filter((element) => !isSwitch(element)), ...namedFirst.filter(isSwitch)]
      : namedFirst

  let items = orderedProperties.map(renderItem)
  if (leadsListItem && items.length > 1) {
    items = [
      items[0],
      <div key="lead-children" className="form-object-field settings-panel">
        {items.slice(1)}
      </div>,
    ]
  }

  const isGroupProperty = (name: string) => {
    if (foldingGroups.has(name)) return false
    const propertySchema = schema.properties?.[name]
    if (!propertySchema || typeof propertySchema !== 'object') return false
    const resolved = registry.schemaUtils.retrieveSchema(propertySchema, formData?.[name])
    return isGroupSchema(resolved) && (wrapsLooseFields || resolved.type === 'object')
  }

  const segments: (JSX.Element | JSX.Element[])[] = []
  if (wrapsLooseFields || panelsFields) {
    visibleProperties.forEach((element) => {
      const last = segments[segments.length - 1]
      if (isGroupProperty(element.name)) segments.push(renderItem(element))
      else if (Array.isArray(last)) last.push(renderItem(element))
      else segments.push([renderItem(element)])
    })
  }

  if (wrapsLooseFields) {
    items = segments.map((segment) =>
      Array.isArray(segment) ? (
        <SettingsGroup key={`loose-${segment[0].key}`}>
          <div className="form-object-field settings-panel">{segment}</div>
        </SettingsGroup>
      ) : (
        segment
      ),
    )
  }

  const wrapFields = (content: ReactNode) => (
    <div
      data-hidden={matches ? 'false' : 'true'}
      style={{
        visibility: matches ? 'visible' : 'hidden',
        position: matches ? 'relative' : 'absolute',
        height: matches ? 'auto' : 0,
      }}
    >
      {longDescription}
      <div
        className={clsx(layoutClassName, wrapsLooseFields && 'settings-sheet-items')}
        data-test="test-aa"
        data-fieldid={id}
      >
        {content}
      </div>
    </div>
  )

  if (!panelsFields) return () => wrapFields(items)

  return (lead?: ReactNode) => {
    const panels = lead && !Array.isArray(segments[0]) ? [[], ...segments] : segments
    return wrapFields(
      panels.map((segment, index) =>
        Array.isArray(segment) ? (
          <div
            key={`panel-${segment[0]?.key ?? 'lead'}`}
            className={clsx(
              'form-object-field settings-panel',
              index === 0 && !!lead && 'settings-panel-lead',
            )}
          >
            {index === 0 && lead}
            {segment}
          </div>
        ) : (
          segment
        ),
      ),
    )
  }
}
