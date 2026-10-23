import { useMemo } from 'react'
import { useSettingsGroupDepth } from '../SettingsGroup/SettingsGroupContextInstance'
import { isPanelSectionObject } from '../SettingsGroup/SettingsGroupHelpers'
import { useSettingsListItem } from '../SettingsGroup/SettingsListItemContextInstance'
import {
  buildObjectContextMenu,
  buildObjectFields,
  buildLongDescription,
  buildObjectTitle,
  getEnabledToggler,
  getObjectOverrideLevel,
  showObjectContextMenu,
} from './ObjectFieldTemplateHelpers'
import ObjectFieldTemplateView from './ObjectFieldTemplateView'
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
  const namedListItem = leadsListItem && !!listItem?.named
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

  // memoize the fields

  const enabledToggler = useMemo(() => getEnabledToggler(props.properties), [props.properties])

  const { properties, schema, formContext, formData, registry, idSchema, id } = props
  const fields = useMemo(
    () =>
      buildObjectFields({
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
      }),
    [
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
    ],
  )

  const objectId = props.idSchema.$id
  const { level, onRemoveAllOverrides, onPinOverride, onRemoveOverride, onPasteValue } =
    props.formContext

  const contextMenuModel = useMemo(
    () =>
      buildObjectContextMenu({
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
      }),
    [
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
    ],
  )

  // aaand... render

  if (['compact', 'root', 'expanded'].includes(props.schema.layout) && !listItem) return fields()

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

  const matches = matchesFilterKeys(
    props.formContext.searchText,
    props.formContext.filterKeys,
    props.formContext.addonName,
    props.idSchema.$id,
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
