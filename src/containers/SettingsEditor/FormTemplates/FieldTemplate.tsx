import { useMemo } from 'react'
import { Divider } from '@ynput/ayon-react-components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'

import isEqual from 'lodash/isEqual'
import { $Any } from '@types'
import { FieldTemplateProps } from '@rjsf/utils'
import { CSS } from 'styled-components/dist/types'
import { matchesFilterKeys } from './searchMatcher'
import { renderFieldTemplate } from './FieldTemplateHelpers'
import { buildOverrideContextMenu } from './ObjectFieldTemplateHelpers'
import { isPropertyInScope } from '../SettingsGroup/SettingsGroupHelpers'

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

  const filterKeys = props.formContext.filterKeys
  const section = props.schema.section

  const dividerMatches = matchesFilterKeys(
    props.formContext.searchText,
    filterKeys,
    props.formContext.addonName,
    props.id,
  )
  const divider =
    !flatLayout && section && dividerMatches ? (
      <Divider>{section !== '---' ? section : undefined}</Divider>
    ) : null

  // Solve overrides for lists and leaves

  const override = props.formContext.overrides ? props.formContext.overrides[props.id] : null
  const path = useMemo(() => override?.path || [], [override?.path])

  const fieldChanged = useMemo(() => {
    return arrayContainsArray(props.formContext.changedKeys, path)
  }, [props.formContext.changedKeys, path])

  const overrideLevel = fieldChanged ? 'edit' : override?.level || 'default'
  // classic marks a value overridden with its whole group in italics; flat leaves it out
  const labelStyle: CSS.Properties = override?.inGroup && !flatLayout ? { fontStyle: 'italic' } : {}

  // Context menu

  const contextMenuModel = useMemo(
    () =>
      buildOverrideContextMenu({
        level,
        onPinOverride,
        onRemoveOverride,
        onPasteValue,
        formData: props.formData,
        override,
        overrideLevel,
        path,
      }),
    [
      level,
      onPasteValue,
      onPinOverride,
      onRemoveOverride,
      override,
      overrideLevel,
      path,
      props.formData,
    ],
  )

  const onContextMenu = (e: $Any) => {
    e.preventDefault()
    contextMenu(e, contextMenuModel)
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
    onContextMenu,
  })
}

export default FieldTemplate
