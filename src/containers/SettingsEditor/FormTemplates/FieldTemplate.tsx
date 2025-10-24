import { useMemo } from 'react'
import { Divider } from '@ynput/ayon-react-components'
import SettingsPanel from '../SettingsPanel'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'

import { isEqual, kebabCase } from 'lodash'
import { copyToClipboard } from '@shared/util'
import { $Any } from '@types'
import { FieldTemplateProps } from '@rjsf/utils'
import { CSS } from 'styled-components/dist/types'
import { matchesFilterKeys } from './searchMatcher'
import { toast } from 'react-toastify'
import AccessWidget from '../Widgets/AccessWidget'
import clsx from 'clsx'

const arrayStartsWith = (arr1: $Any, arr2: $Any) => {
  // return true, if first array starts with second array
  if ((arr2 || []).length > (arr1 || []).length) return false
  if ((arr2 || []).length === 0) return true
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

const arrayContainsArray = (arr1: $Any, arr2: $Any) => {
  return arr1.some((el: $Any) => isEqual(el, arr2))
}

function FieldTemplate(props: FieldTemplateProps) {
  const [contextMenu] = useCreateContextMenu([])

  // Do not render the field if it belongs to a different scope (studio/project/local) or if it is hidden

  if (
    props.schema.scope !== undefined &&
    !(props.schema.scope || ['studio', 'project']).includes(props.formContext.level)
  ) {
    return null
  }
  const filterKeys = props.formContext.filterKeys
  const section = props.schema.section

  const divider = useMemo(() => {
    const matches = matchesFilterKeys(
      props.formContext.searchText,
      props.formContext.filterKeys,
      props.formContext.addonName,
      props.id,
    )
    if (props.schema.section && matches) {
      return <Divider> {props.schema.section !== '---' && props.schema.section} </Divider>
    }

    return <></>
  }, [section, filterKeys])

  // Object fields

  if (props.schema.type === 'object' && props.schema?.widget !== 'access') {
    return (
      <>
        {divider}
        {props.children}
      </>
    )
  }

  // Solve overrides for lists and leaves

  const override = props.formContext.overrides ? props.formContext.overrides[props.id] : null
  const path = override?.path || []

  const fieldChanged = useMemo(() => {
    return arrayContainsArray(props.formContext.changedKeys, path)
  }, [props.formContext.changedKeys, path])

  const overrideLevel = fieldChanged ? 'edit' : override?.level || 'default'
  let labelStyle: CSS.Properties = {}
  if (override) {
    if (override?.inGroup) labelStyle.fontStyle = 'italic'
  }

  // Context menu

  const contextMenuModel = useMemo(() => {
    const rmPath = override?.inGroup || path
    let model = []

    if (props.formContext.onPinOverride)
      model.push({
        label: `Add current ${rmPath[rmPath.length - 1]} value as ${
          props.formContext.level
        } override`,
        command: () => props.formContext.onPinOverride(rmPath),
        disabled: overrideLevel === props.formContext.level,
      })

    if (props.formContext.onRemoveOverride)
      model.push({
        label: `Remove ${props.formContext.level} override from ${rmPath[rmPath.length - 1]}`,
        command: () => props.formContext.onRemoveOverride(rmPath),
        disabled: overrideLevel !== props.formContext.level,
      })

    model.push({
      label: 'Copy',
      command: () => {
        if (!props.formData || (Array.isArray(props.formData) && props.formData.length === 0)) {
          toast.warn('No data to copy')
          return
        }
        copyToClipboard(JSON.stringify(props.formData, null, 2))
      },
    })

    model.push({
      label: 'Paste',
      disabled: !props.formContext.onPasteValue,
      command: () => props.formContext.onPasteValue(path),
    })

    return model
  }, [override, props.formData, path])

  const onContextMenu = (e: $Any) => {
    e.preventDefault()
    contextMenu(e, contextMenuModel)
    if (props.formContext.onSetBreadcrumbs && path) props.formContext.onSetBreadcrumbs(path)
  }

  // Array fields

  if (
    props.schema.type === 'array' &&
    // @ts-ignore
    props.schema.items.type !== 'string' &&
    props.schema.layout !== 'compact'
  ) {
    let classes = []

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
        <SettingsPanel
          objId={props.id}
          title={props.schema.title}
          description={props.schema.description}
          className={classes.join(' ')}
          onClick={() => {
            if (props.formContext.onSetBreadcrumbs && path) props.formContext.onSetBreadcrumbs(path)
          }}
          onContextMenu={onContextMenu}
          currentId={props.formContext.currentId}
          layout={undefined}
          enabledToggler={undefined}
        >
          {props.children}
        </SettingsPanel>
      </div>
    )
  }

  // Leaves

  const widgetClass =
    props.schema.type === 'array' && props.schema.layout === 'compact' && props.formData?.length
      ? 'left-border'
      : ''

  // do not show error for color widgets (they are declared as strings, but
  // contains arrays. The error is not relevant for the user)
  //
  // TODO: ignoring errors for now. Too many false positives
  const className = `form-inline-field`
  const classNameWrapper = `${className}-wrapper`
  // let className = `form-inline-field ${
  //   props.errors.props.errors && props.schema.widget !== 'color' ? 'error' : ''
  // }`
  const matches = matchesFilterKeys(
    props.formContext.searchText,
    props.formContext.filterKeys,
    props.formContext.addonName,
    props.id,
  )

  let mainWidget = null
  if (props.schema.widget === 'access') {
    mainWidget = <AccessWidget {...props} />
  } else {
    mainWidget = props.children
  }

  const kebabLabel = kebabCase(props.label || '')

  return (
    <div
      data-schema-id={props.id}
      data-hidden={matches ? 'false' : 'true'}
      style={{
        visibility: matches ? 'visible' : 'hidden',
        position: matches ? 'relative' : 'absolute',
        height: matches ? 'auto' : 0,
      }}
      className={clsx(classNameWrapper, `${kebabLabel}-wrapper`)}
    >
      {divider}
      <div
        className={clsx(className, kebabLabel)}
        data-fieldid={props.id}
        onContextMenu={onContextMenu}
        data-tooltip={props.rawDescription}
        data-tooltip-delay={300}
        data-tooltip-as="markdown"
        data-tooltip-position="mouse"
      >
        {props.label && props.schema.title && (
          <div className={`form-inline-field-label ${overrideLevel}`}>
            <span
              onClick={() => {
                if (props.formContext.onSetBreadcrumbs) {
                  if (override?.path) props.formContext.onSetBreadcrumbs(override.path)
                }
              }}
              style={labelStyle}
            >
              {props.label}
            </span>
          </div>
        )}

        <div className={`form-inline-field-widget ${widgetClass}`}>{mainWidget}</div>
      </div>
    </div>
  )
}

export default FieldTemplate
