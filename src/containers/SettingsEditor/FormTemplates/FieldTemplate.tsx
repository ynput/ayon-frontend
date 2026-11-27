import { useMemo } from 'react'
import { Divider } from '@ynput/ayon-react-components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'

import isEqual from 'lodash/isEqual'
import { $Any } from '@types'
import { FieldTemplateProps } from '@rjsf/utils'
import { CSS } from 'styled-components/dist/types'
import { matchesFilterKeys } from './searchMatcher'
import { isInsidePath } from './settingsPath'
import { renderFieldTemplate } from './FieldTemplateHelpers'
import { buildOverrideContextMenu } from './ObjectFieldTemplateHelpers'
import { getReadOnlyReason } from './readOnlySettings'
import { isListGroupSchema, isPropertyInScope } from '../SettingsGroup/SettingsGroupHelpers'
import { pointsInside, useFormContextSelector } from '../formContextStore'

const arrayContainsArray = (arr1: $Any, arr2: $Any) => {
  return arr1.some((el: $Any) => isEqual(el, arr2))
}

function FieldTemplate(props: FieldTemplateProps) {
  const [contextMenu] = useCreateContextMenu([])
  const flatLayout = !!props.formContext.flatLayout
  const { level, onPinOverride, onRemoveOverride, onPasteValue, onSetBreadcrumbs } =
    props.formContext

  // Do not render the field if it belongs to a different scope (studio/project/local) or if it is hidden
  const outOfScope =
    props.schema.scope !== undefined && !isPropertyInScope(props.schema, props.formContext)

  const isListGroup = isListGroupSchema(props.schema, flatLayout)
  const { override, fieldChanged, listChanged, matches, currentId } = useFormContextSelector(
    props.formContext,
    (context) => {
      const fieldOverride = context.overrides?.[props.id] ?? null
      const fieldPath = fieldOverride?.path || []
      const changedKeys = context.changedKeys || []
      return {
        override: fieldOverride,
        fieldChanged: arrayContainsArray(changedKeys, fieldPath),
        // a list drawn as a group shows a change anywhere inside it
        listChanged: isListGroup && changedKeys.some((key: $Any) => isInsidePath(key, fieldPath)),
        matches: matchesFilterKeys(
          context.searchText,
          context.filterKeys,
          context.addonName,
          props.id,
        ),
        currentId: isListGroup ? pointsInside(context.currentId, props.id) : null,
      }
    },
  )

  const section = props.schema.section
  const divider =
    !flatLayout && section && matches ? (
      <Divider>{section !== '---' ? section : undefined}</Divider>
    ) : null

  // a list drawn as a group (renderFieldTemplate) can be edited as JSON from its title,
  // and only where its place in the data is known: any other would open the whole form
  const onEditJson = isListGroup && override?.path ? props.formContext.onEditJson : undefined
  const jsonTitle = props.schema.title || props.label
  const path = useMemo(() => override?.path || [], [override?.path])

  const overrideLevel = fieldChanged ? 'edit' : override?.level || 'default'
  // classic marks a value overridden with its whole group in italics. Flat leaves it out
  const labelStyle: CSS.Properties = override?.inGroup && !flatLayout ? { fontStyle: 'italic' } : {}

  // Context menu

  // built when it opens: whether a list holds a read-only field walks its items
  const buildContextMenu = () =>
    buildOverrideContextMenu({
      level,
      onPinOverride,
      onRemoveOverride,
      onPasteValue,
      onEditJson,
      jsonTitle,
      formData: props.formData,
      override,
      overrideLevel,
      path,
      readOnlyReason: getReadOnlyReason(
        props.formContext,
        props.schema,
        props.formData,
        props.registry,
      ),
    })

  const onContextMenu = (e: $Any) => {
    e.preventDefault()
    contextMenu(e, buildContextMenu())
    if (onSetBreadcrumbs && path) onSetBreadcrumbs(path)
  }

  if (outOfScope) return null

  return renderFieldTemplate({
    props,
    flatLayout,
    divider,
    path,
    override,
    overrideLevel,
    labelStyle,
    matches,
    isListGroup,
    listChanged,
    currentId,
    onContextMenu,
  })
}

export default FieldTemplate
