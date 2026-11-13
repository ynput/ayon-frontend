import { ReactNode, useMemo } from 'react'
import { useSettingsGroupDepth } from '../SettingsGroup/SettingsGroupContextInstance'
import { isInlineObjectLayout, isPanelSectionObject } from '../SettingsGroup/SettingsGroupHelpers'
import { useSettingsListItem } from '../SettingsGroup/SettingsListItemContextInstance'
import {
  buildOverrideContextMenu,
  buildLongDescription,
  buildObjectTitle,
  getEnabledToggler,
  getObjectOverrideLevel,
  showObjectContextMenu,
} from './ObjectFieldTemplateHelpers'
import ObjectFieldTemplateView from './ObjectFieldTemplateView'
import { ObjectFields } from './ObjectFields'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'

import { $Any } from '@types'
import { ObjectFieldTemplateProps } from '@rjsf/utils'
import { matchesFilterKeys } from './searchMatcher'

function ObjectFieldTemplate(props: { id: string } & ObjectFieldTemplateProps) {
  const [contextMenu] = useCreateContextMenu([])
  let className = 'form-object-field'

  const flatLayout = !!props.formContext.flatLayout
  const isRoot = props.idSchema.$id === 'root'
  const groupDepth = useSettingsGroupDepth()
  // set when this object is a list item that folds; it then always gets a header
  const listItem = useSettingsListItem()
  // an open list item leads with its name (or first field); the rest sit in a panel
  const leadsListItem = flatLayout && !!listItem
  // the field the open item leads with: its name, label or title
  const leadField = leadsListItem ? listItem?.leadField : undefined
  // In the flat layout the root's loose fields have no card of their own, so it makes some
  const wrapsLooseFields =
    flatLayout && groupDepth === 0 && (isRoot || props.schema.layout === 'root')
  // a card's or section's fields sit in inset panels, between its sub-groups
  const panelsFields =
    flatLayout &&
    isPanelSectionObject({
      layout: props.schema.layout,
      isRoot,
      isListItem: !!listItem,
    })

  // Highlight overrides and changed fields

  const objId = props.idSchema.$id
  const override = props.formContext.overrides[objId]
  const path = override?.path

  const overrideLevel = useMemo(
    () => getObjectOverrideLevel(props.formContext.changedKeys, props.formContext.overrides, path),
    [path, props.formContext.changedKeys, props.formContext.overrides],
  )

  if (props.schema.isgroup && overrideLevel === 'edit') {
    className += ' group-changed'
  }

  // Object description (from docstrings)

  const shortDescription = props.schema.description && props.schema.description.split('\n')[0]

  const longDescription = useMemo(
    () => buildLongDescription(props.schema.description),
    [props.schema.description],
  )

  // formContext and registry are new objects on every render, so this is worked out each time
  const enabledToggler = getEnabledToggler(props.properties)

  const matches = matchesFilterKeys(
    props.formContext.searchText,
    props.formContext.filterKeys,
    props.formContext.addonName,
    props.idSchema.$id,
  )

  const { properties } = props
  // a group's title row may lead its first panel (SettingsGroup hands it over)
  const fields = (lead?: ReactNode) => (
    <ObjectFields
      properties={properties}
      schema={props.schema}
      formContext={props.formContext}
      formData={props.formData}
      registry={props.registry}
      idSchema={props.idSchema}
      id={props.id}
      className={className}
      mode={wrapsLooseFields ? 'sheet' : panelsFields ? 'panels' : 'plain'}
      flatLayout={flatLayout}
      leadsListItem={leadsListItem}
      leadField={leadField}
      longDescription={longDescription}
      matches={matches}
      lead={lead}
    />
  )

  const objectId = props.idSchema.$id
  const { level, onRemoveAllOverrides, onPinOverride, onRemoveOverride, onPasteValue } =
    props.formContext

  const contextMenuModel = useMemo(
    () =>
      buildOverrideContextMenu({
        isRoot,
        level,
        onRemoveAllOverrides,
        onPinOverride,
        onRemoveOverride,
        onPasteValue,
        formData: props.formData,
        override,
        overrideLevel,
        path,
      }),
    [
      isRoot,
      level,
      onRemoveAllOverrides,
      onPinOverride,
      onRemoveOverride,
      onPasteValue,
      props.formData,
      override,
      overrideLevel,
      path,
    ],
  )

  // aaand... render

  // a list item that only wraps one group (see getListItemShape) is that group: no box of its own
  if (flatLayout && props.schema.listUnwrap) {
    return <>{properties.find((element) => element.name === props.schema.listUnwrap)?.content}</>
  }

  if (isInlineObjectLayout(props.schema.layout) && !listItem) return fields()

  // Title + handle root object

  if (!props.schema?.properties) {
    console.warn(`object schema does not have any props:`, props.schema)
  }

  const titleComponent = buildObjectTitle({
    title: props.title,
    schema: props.schema,
    formData: props.formData,
    objectId,
    formTitle: props.formContext.formTitle,
    headerProjectName: props.formContext.headerProjectName,
    headerSiteId: props.formContext.headerSiteId,
    headerVariant: props.formContext.headerVariant,
    listItem,
  })

  // Execute context menu

  const onContextMenu = (e: $Any) =>
    showObjectContextMenu(
      e,
      props.formContext.onSetBreadcrumbs,
      path,
      contextMenuModel,
      contextMenu,
    )

  const onGroupClick = () => props.formContext.onSetBreadcrumbs?.(path)

  return (
    <ObjectFieldTemplateView
      objId={objId}
      isRoot={isRoot}
      flatLayout={flatLayout}
      matches={matches}
      title={titleComponent}
      groupDescription={props.schema.description}
      shortDescription={shortDescription}
      overrideLevel={overrideLevel}
      enabledToggler={enabledToggler}
      onContextMenu={onContextMenu}
      onGroupClick={onGroupClick}
      currentId={props.formContext.currentId}
      fields={fields}
    />
  )
}

export default ObjectFieldTemplate
