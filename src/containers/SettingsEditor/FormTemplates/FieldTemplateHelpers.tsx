import clsx from 'clsx'
import kebabCase from 'lodash/kebabCase'
import { ReactNode, CSSProperties } from 'react'
import { FieldTemplateProps } from '@rjsf/utils'
import { $Any } from '@types'
import SettingsPanel from '../SettingsPanel'
import SearchHidden from './SearchHidden'
import { SettingsGroup } from '../SettingsGroup/SettingsGroup'
import { SettingField, getSettingFieldKind } from '../SettingField'
import AccessWidget from '../Widgets/AccessWidget/AccessWidget'
import { ListColorScheme, hasColorField } from '../ListColorScheme'

type RenderFieldArgs = {
  props: FieldTemplateProps
  flatLayout: boolean
  divider: ReactNode
  path: $Any
  override?: $Any
  overrideLevel: string
  labelStyle?: CSSProperties
  /** Whether the field matches the search */
  matches: boolean
  /** A list drawn as a group, not as a field (isListGroupSchema) */
  isListGroup: boolean
  /** Whether a list drawn as a group changed anywhere inside */
  listChanged: boolean
  /** The selected field id, while it is inside a list drawn as a group */
  currentId: string | null
  onContextMenu: (event: $Any) => void
}

export const renderFieldTemplate = ({
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
}: RenderFieldArgs) => {
  if (props.schema.type === 'object' && props.schema?.widget !== 'access') {
    return (
      <>
        {divider}
        {props.children}
      </>
    )
  }

  if (isListGroup) {
    const classes = listChanged
      ? ['obj-override-edit', 'group-changed']
      : [`obj-override-${overrideLevel}`]
    const onGroupClick = () => {
      if (props.formContext.onSetBreadcrumbs && path) props.formContext.onSetBreadcrumbs(path)
    }

    // an editor that can set a list as a whole (anatomy) offers a colour scheme to draw
    // the colours of a list of types, statuses or tags from
    const listPath: string[] | undefined = override?.path
    const colorScheme =
      flatLayout &&
      props.formContext.onSetValue &&
      listPath &&
      Array.isArray(props.formData) &&
      hasColorField(props.schema.items, props.registry) ? (
        <ListColorScheme
          listId={props.id}
          path={listPath}
          items={props.formData}
          onSetValue={props.formContext.onSetValue}
        />
      ) : undefined

    return (
      <SearchHidden matches={matches} schemaId={props.id}>
        {flatLayout ? (
          <SettingsGroup
            objId={props.id}
            title={props.schema.title}
            description={props.schema.description}
            className={clsx(classes, 'settings-group-list')}
            isList
            headerExtra={colorScheme}
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
            currentId={currentId}
            layout={undefined}
            enabledToggler={undefined}
          >
            {props.children}
          </SettingsPanel>
        )}
      </SearchHidden>
    )
  }

  const widgetClass =
    props.schema.type === 'array' && props.schema.layout === 'compact' && props.formData?.length
      ? 'left-border'
      : ''
  const mainWidget = props.schema.widget === 'access' ? <AccessWidget {...props} /> : props.children
  const kebabLabel = kebabCase(props.label || '')
  const onLabelClick = () => {
    if (props.formContext.onSetBreadcrumbs && override?.path) {
      props.formContext.onSetBreadcrumbs(override.path)
    }
  }

  return (
    <SearchHidden
      matches={matches}
      schemaId={props.id}
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
    </SearchHidden>
  )
}
