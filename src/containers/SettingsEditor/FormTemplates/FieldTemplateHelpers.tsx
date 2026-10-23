import clsx from 'clsx'
import kebabCase from 'lodash/kebabCase'
import { ReactNode, CSSProperties } from 'react'
import { FieldTemplateProps } from '@rjsf/utils'
import { $Any } from '@types'
import SettingsPanel from '../SettingsPanel'
import { SettingsGroup } from '../SettingsGroup/SettingsGroup'
import { SettingField } from '../SettingField/SettingField'
import { getSettingFieldKind } from '../SettingField/SettingFieldHelpers'
import AccessWidget from '../Widgets/AccessWidget/AccessWidget'
import { matchesFilterKeys } from './searchMatcher'

type RenderFieldArgs = {
  props: FieldTemplateProps
  flatLayout: boolean
  divider: ReactNode
  path: $Any
  override?: $Any
  overrideLevel: string
  labelStyle?: CSSProperties
  onContextMenu: (event: $Any) => void
}

const arrayStartsWith = (arr1: $Any, arr2: $Any) => {
  if ((arr2 || []).length > (arr1 || []).length) return false
  if ((arr2 || []).length === 0) return true
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

export const renderFieldTemplate = ({
  props,
  flatLayout,
  divider,
  path,
  override,
  overrideLevel,
  labelStyle,
  onContextMenu,
}: RenderFieldArgs) => {
  if (props.schema.type === 'object' && props.schema?.widget !== 'access') {
    return (
      <>
        {divider}
        {props.children}
      </>
    )
  }

  if (
    props.schema.type === 'array' &&
    // @ts-ignore
    props.schema.items.type !== 'string' &&
    props.schema.layout !== 'compact'
  ) {
    const classes = []

    for (const changedPath of props.formContext.changedKeys) {
      if (arrayStartsWith(changedPath, path)) {
        classes.push('obj-override-edit')
        classes.push('group-changed')
        break
      }
    }

    if (!classes.includes('obj-override-edit')) classes.push(`obj-override-${overrideLevel}`)

    const matches = matchesFilterKeys(
      props.formContext.searchText,
      props.formContext.filterKeys,
      props.formContext.addonName,
      props.id,
    )
    const onGroupClick = () => {
      if (props.formContext.onSetBreadcrumbs && path) props.formContext.onSetBreadcrumbs(path)
    }

    return (
      <div
        data-schema-id={props.id}
        data-hidden={matches ? 'false' : 'true'}
        style={{
          visibility: matches ? 'visible' : 'hidden',
          position: matches ? 'relative' : 'absolute',
          height: matches ? 'auto' : 0,
        }}
      >
        {flatLayout ? (
          <SettingsGroup
            objId={props.id}
            title={props.schema.title}
            description={props.schema.description}
            className={clsx(classes, 'settings-group-list')}
            isList
            onClick={onGroupClick}
            onContextMenu={onContextMenu}
          >
            {props.children}
          </SettingsGroup>
        ) : (
          <SettingsPanel
            objId={props.id}
            title={props.schema.title}
            description={props.schema.description}
            className={classes.join(' ')}
            onClick={onGroupClick}
            onContextMenu={onContextMenu}
            currentId={props.formContext.currentId}
            layout={undefined}
            enabledToggler={undefined}
          >
            {props.children}
          </SettingsPanel>
        )}
      </div>
    )
  }

  const widgetClass =
    props.schema.type === 'array' && props.schema.layout === 'compact' && props.formData?.length
      ? 'left-border'
      : ''
  const matches = matchesFilterKeys(
    props.formContext.searchText,
    props.formContext.filterKeys,
    props.formContext.addonName,
    props.id,
  )
  const mainWidget = props.schema.widget === 'access' ? <AccessWidget {...props} /> : props.children
  const kebabLabel = kebabCase(props.label || '')
  const onLabelClick = () => {
    if (props.formContext.onSetBreadcrumbs && override?.path) {
      props.formContext.onSetBreadcrumbs(override.path)
    }
  }

  return (
    <div
      data-schema-id={props.id}
      data-hidden={matches ? 'false' : 'true'}
      style={{
        visibility: matches ? 'visible' : 'hidden',
        position: matches ? 'relative' : 'absolute',
        height: matches ? 'auto' : 0,
      }}
      className={clsx('form-inline-field-wrapper', `${kebabLabel}-wrapper`)}
    >
      {divider}
      <SettingField
        fieldId={props.id}
        className={kebabLabel}
        label={props.schema.title ? props.label : undefined}
        level={overrideLevel}
        labelStyle={labelStyle}
        kind={flatLayout ? getSettingFieldKind(props.schema) : undefined}
        description={props.rawDescription}
        widgetClassName={widgetClass}
        onContextMenu={onContextMenu}
        onLabelClick={onLabelClick}
      >
        {mainWidget}
      </SettingField>
    </div>
  )
}
