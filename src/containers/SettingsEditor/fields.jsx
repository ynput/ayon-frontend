import React, { useMemo } from 'react'
import { Button, Divider } from '@ynput/ayon-react-components'
import ReactMarkdown from 'react-markdown'
import SettingsPanel from './SettingsPanel'
import styled from 'styled-components'
import useCreateContext from '@hooks/useCreateContext'

import { isEqual } from 'lodash'
import { Badge, BadgeWrapper } from '@components/Badge'
import copyToClipboard from '@helpers/copyToClipboard'

const FormArrayField = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

const FormArrayFieldItem = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  gap: var(--base-gap-large);

  margin-right: 4px;

  .panel-content {
    flex-grow: 1;
  }
`

const ArrayItemControls = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 5px;

  button {
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }
`

const arrayStartsWith = (arr1, arr2) => {
  // return true, if first array starts with second array
  if ((arr2 || []).length > (arr1 || []).length) return false
  if ((arr2 || []).length === 0) return true
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

const arrayContainsArray = (arr1, arr2) => {
  return arr1.some((el) => isEqual(el, arr2))
}

function ObjectFieldTemplate(props) {
  const [contextMenu] = useCreateContext([])
  let className = 'form-object-field'
  if (props.schema.layout) className += ` layout-${props.schema.layout}`

  // Highlight overrides and changed fields

  const objId = props.idSchema.$id
  const override = props.formContext.overrides[objId]
  const path = override?.path

  const overrideLevel = useMemo(() => {
    // check whether a child object is changed locally
    for (const changedPath of props.formContext.changedKeys) {
      if (arrayStartsWith(changedPath, path)) {
        return 'edit'
      }
    }

    for (const changedId in props.formContext.overrides) {
      const changedPath = props.formContext.overrides[changedId].path
      if (arrayStartsWith(changedPath, path)) {
        return props.formContext.overrides[changedId].level
      }
    }

    return 'default'
  }, [path, props.formContext.changedKeys, props.formContext.overrides])

  if (props.schema.isgroup && overrideLevel === 'edit') {
    className += ' group-changed'
  }

  // Object description (from docstrings)

  const shortDescription = props.schema.description && props.schema.description.split('\n')[0]

  const longDescription = useMemo(() => {
    if (!props.schema.description) return null
    return (
      <div className="form-object-field-help">
        <ReactMarkdown>{props.schema.description}</ReactMarkdown>
      </div>
    )
  }, [props.schema.description])

  // memoize the fields

  const enabledToggler = useMemo(() => {
    for (const element of props.properties) {
      if (element?.name === 'enabled') {
        return <span className="form-object-header-enabled-toggler">{element.content}</span>
      }
    }
  }, [props.properties])

  const fields = useMemo(() => {
    let hiddenFields = []
    for (const propName in props?.schema?.properties || {}) {
      const ppts = props?.schema?.properties[propName]
      if (!(ppts.scope || ['studio', 'project']).includes(props.formContext.level)) {
        hiddenFields.push(propName)
      }
      if (ppts.conditionalEnum) {
        hiddenFields = [
          ...hiddenFields,
          ...(ppts?.enum || []).filter((e) => e !== props.formData[propName]),
        ]
      }
    }

    if (props.schema.layout === 'expanded') {
      let nameField = null
      let otherFields = []

      for (const element of props.properties) {
        if (element?.name === 'name') nameField = element.content
        else otherFields.push(element.content)
      }
      return (
        <>
          {longDescription}
          <div className={className}>
            <div className="name-field">{nameField}</div>
            <div className="data-fields">
              {otherFields
                .filter((f) => !hiddenFields.includes(f.props.name))
                .map((element) => element)}
            </div>
          </div>
        </>
      )
    } // ugly layout

    return (
      <>
        {longDescription}
        <div className={className} data-fieldid={props.id}>
          {props.properties
            .filter(
              (element) =>
                (element.name !== 'enabled' || ['compact', 'root'].includes(props.schema.layout)) &&
                !hiddenFields.includes(element.name),
            )
            .map((element, index) => (
              <div key={index} className="form-object-field-item">
                {element.content}
              </div>
            ))}
        </div>
      </>
    )
  }, [props.properties, className])

  // aaand... render

  if (['compact', 'root', 'expanded'].includes(props.schema.layout)) return fields

  const contextMenuModel = useMemo(() => {
    let model = []

    if (props.idSchema.$id === 'root') {
      model.push({
        label: `Remove all ${props.formContext.level} overrides`,
        disabled: !props.formContext.onRemoveAllOverrides,
        command: () => {
          props.formContext.onRemoveAllOverrides()
        },
      })
    } else {
      const rmPath = override?.inGroup || path || ['root']
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
    }

    model.push(
      {
        label: 'Copy',
        command: () => copyToClipboard(JSON.stringify(props.formData, null, 2)),
      },
      {
        label: 'Paste',
        disabled: !props.formContext.onPasteValue,
        command: () => {
          props.formContext.onPasteValue(path || [])
        },
      },
    )
    return model
  }, [override, overrideLevel, path, props.formData])

  // Title + handle root object

  let title = props.title
  // In case of "pseudo-dicts" (array of objects with a "name" attribute)
  // use the "name" attributeas the title

  if (!props.schema?.properties) {
    console.warn(`object schema does not have any props:`, props.schema)
  }

  if ('name' in (props.schema.properties || {})) {
    let label = null
    if ('label' in (props.schema.properties || {})) label = props.formData.label
    title = label || props.formData.name || <span className="new-object">Unnamed item</span>
  }

  if (props.idSchema.$id === 'root' && props.formContext.formTitle)
    title = props.formContext.formTitle

  if (props.idSchema.$id === 'root') {
    const projectMark = props.formContext.headerProjectName && (
      <Badge hl="project">{props.formContext.headerProjectName}</Badge>
    )
    const siteMark = props.formContext.headerSiteId && (
      <Badge hl="site">{props.formContext.headerSiteId}</Badge>
    )

    const envMark = props.formContext.headerVariant && (
      <Badge
        hl={
          ['production', 'staging'].includes(props.formContext.headerVariant)
            ? props.formContext.headerVariant
            : 'developer'
        }
      >
        {props.formContext.headerVariant}
      </Badge>
    )

    title = (
      <>
        {title}
        <BadgeWrapper>
          {projectMark}
          {siteMark}
          {envMark}
        </BadgeWrapper>
      </>
    )
  }

  // Execute context menu

  const onContextMenu = (e) => {
    if (props.formContext.onSetBreadcrumbs) props.formContext.onSetBreadcrumbs(path || [])
    if (!contextMenuModel?.length) return
    e.preventDefault()
    contextMenu(e, contextMenuModel)
  }

  return (
    <SettingsPanel
      objId={objId}
      onClick={() => {
        if (props.formContext.onSetBreadcrumbs) props.formContext.onSetBreadcrumbs(path)
      }}
      title={title}
      description={shortDescription}
      className={`obj-override-${overrideLevel}`}
      enabledToggler={enabledToggler}
      onContextMenu={onContextMenu}
      currentId={props.formContext.currentId}
    >
      {fields}
    </SettingsPanel>
  )
}

function FieldTemplate(props) {
  const [contextMenu] = useCreateContext([])

  // Do not render the field if it belongs to a different scope (studio/project/local) or if it is hidden

  if (
    props.schema.scope !== undefined &&
    !(props.schema.scope || ['studio', 'project']).includes(props.formContext.level)
  ) {
    return null
  }

  const divider = useMemo(() => {
    if (props.schema.section)
      return <Divider>{props.schema.section !== '---' && props.schema.section}</Divider>
    else return <></>
  }, [props.schema.section])

  // Object fields

  if (props.schema.type === 'object') {
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
  let labelStyle = {}

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
      command: () => copyToClipboard(JSON.stringify(props.formData, null, 2)),
    })

    model.push({
      label: 'Paste',
      disabled: !props.formContext.onPasteValue,
      command: () => props.formContext.onPasteValue(path),
    })

    return model
  }, [override, path])

  const onContextMenu = (e) => {
    e.preventDefault()
    contextMenu(e, contextMenuModel)
    if (props.formContext.onSetBreadcrumbs && path) props.formContext.onSetBreadcrumbs(path)
  }

  // Array fields

  if (
    props.schema.type === 'array' &&
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

    return (
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
      >
        {props.children}
      </SettingsPanel>
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
  let className = `form-inline-field`
  // let className = `form-inline-field ${
  //   props.errors.props.errors && props.schema.widget !== 'color' ? 'error' : ''
  // }`

  return (
    <>
      {divider}
      <div
        className={className}
        data-fieldid={props.id}
        onContextMenu={onContextMenu}
        data-tooltip={props.rawDescription}
        data-tooltip-delay={300}
        data-tooltip-as="markdown"
      >
        {props.label && (
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
        <div className={`form-inline-field-widget ${widgetClass}`}>{props.children}</div>
      </div>
    </>
  )
}

const ArrayItemTemplate = (props) => {
  const parentSchema = props?.children?._owner?.memoizedProps?.schema || {}
  const itemName = props?.children?.props?.formData?.name
  let undeletable = false

  const children = props.children

  if (itemName && (parentSchema.requiredItems || []).includes(itemName)) {
    undeletable = true
    // TODO: Store this information elsewhere. since switching to RTK query
    // schema props are immutable! use form context maybe?

    //if (children.props.formData.name === itemName)
    //  children.props.schema.properties.name.fixedValue = itemName
  }

  const onArrayChanged = () => {
    const parentId = props.children.props.idSchema.$id.split('_').slice(0, -1).join('_')
    const formContext = props.children._owner.memoizedProps.formContext
    const path = formContext.overrides[parentId].path
    formContext.onSetChangedKeys([{ path, isChanged: true }])
  }

  const onRemoveItem = () => {
    onArrayChanged()
    const r = props.onDropIndexClick(props.index)
    r()
  }

  const onMoveUp = () => {
    onArrayChanged()
    const r = props.onReorderClick(props.index, props.index - 1)
    r()
  }

  const onMoveDown = () => {
    onArrayChanged()
    const r = props.onReorderClick(props.index, props.index + 1)
    r()
  }

  const rmButton = props.hasRemove && !parentSchema.disabled && (
    <ArrayItemControls>
      <Button onClick={onRemoveItem} icon="close" disabled={undeletable} />
      <Button onClick={onMoveUp} icon="arrow_upward" />
      <Button onClick={onMoveDown} icon="arrow_downward" />
    </ArrayItemControls>
  )

  return (
    <FormArrayFieldItem>
      {children}
      {rmButton}
    </FormArrayFieldItem>
  )
}

const ArrayFieldTemplate = (props) => {
  /* Complete array including the add button */

  const onAddItem = () => {
    const id = props.idSchema.$id
    const formContext = props.formContext
    const path = formContext.overrides[id]?.path

    formContext.onSetChangedKeys([{ path, isChanged: true }])
    props.onAddClick()
  }

  // for some werird reason, the array sorting breaks when ArrayItemTemplate is
  // not wrapped in react fragment. I suspected it was the key, but it was not.
  // I have no idea why this works, but it does. Do not touch!

  return (
    <FormArrayField>
      {props.items.map((element, idx) => (
        <React.Fragment key={idx}>
          <ArrayItemTemplate {...element} key={element?.key} />
        </React.Fragment>
      ))}

      {props.canAdd && !props.schema?.disabled && (
        <ArrayItemControls>
          <Button onClick={onAddItem} icon="add" />
        </ArrayItemControls>
      )}
    </FormArrayField>
  )
}

export { ObjectFieldTemplate, FieldTemplate, ArrayFieldTemplate }
