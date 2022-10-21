import { useMemo, useRef } from 'react'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'
import { ContextMenu } from 'primereact/contextmenu'

import SettingsPanel from './settingsPanel'

const buildContextMenu = (rmOverrideFunc, pinOverrideFunc) => {
  return [
    {
      label: 'Pin override',
      disabled: !pinOverrideFunc,
      command: pinOverrideFunc,
    },
    {
      label: 'Remove override',
      disabled: !rmOverrideFunc,
      command: rmOverrideFunc,
    },
    {
      label: 'Log event (debug)',
      command: (event) => console.log(event),
    },
    {
      label: 'Copy path',
      command: () => {},
    },
    {
      label: 'Copy value',
      disabled: true,
      command: () => {},
    },
    {
      label: 'Paste value',
      disabled: true,
      command: () => {},
    },
  ]
}

function ObjectFieldTemplate(props) {
  let className = 'form-object-field'
  if (props.schema.layout) className += ` layout-${props.schema.layout}`

  // Highlight overrides and changed fields

  const objId = props.idSchema.$id
  const override = props.formContext.overrides[objId]
  const path = override?.path

  // TODO: actually use overrides
  // NOTE: after a few days, idk what this todo means
  let labelStyle = {}
  let rmOverrideFunc = null
  let pinOverrideFunc = null
  if (override) {
    if (override?.inGroup) labelStyle.fontStyle = 'italic'
    else if (override.level === props.formContext.level)
      rmOverrideFunc = () => {
        props.formContext.onDeleteOverride(path)
      }
  }

  if (!override || override.level !== props.formContext.level) {
    pinOverrideFunc = () => {
      props.formContext.onPinOverride(path)
    }
  }

  const contextMenuModel = buildContextMenu(rmOverrideFunc, pinOverrideFunc)

  let overrideLevel = useMemo(() => {
    let res = 'default'
    for (const childId in props.formContext.overrides) {
      if (!childId.startsWith(`${objId}_`)) continue // not a child of this object
      const child = props.formContext.overrides[childId]

      if (props.formContext.changedKeys.includes(childId)) {
        res = 'edit'
        break
      }

      if (child.level === 'studio' && res === 'default') res = 'studio'
      else if (child.level === 'project' && res !== 'edit') res = 'project'
    }
    return res
    // form data's here, because formContext.overrides is not triggered :/
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    { ...props.formContext.overrides },
    [...props.formContext.changedKeys],
    objId,
    props.formData,
  ])

  if (props.schema.isgroup && overrideLevel === 'edit') {
    className += ' group-changed'
  }

  // Object descrtiption (from docstrings)

  const shortDescription =
    props.schema.description && props.schema.description.split('\n')[0]

  const longDescription = props.schema.description && (
    <>
      {props.schema.description
        .split('\n')
        .slice(1)
        .join('\n')
        .split('\n\n')
        .map((p) => (
          <p>{p}</p>
        ))}
    </>
  )

  // memoize the fields

  const enabledToggler = useMemo(() => {
    for (const element of props.properties) {
      if (element.name === 'enabled') {
        return (
          <span className="form-object-header-enabled-toggler">
            {element.content}
          </span>
        )
      }
    }
  }, [props.properties])

  const fields = useMemo(() => {
    if (props.schema.layout === 'expanded') {
      let nameField = null
      let otherFields = []

      for (const element of props.properties) {
        if (element.name === 'name') nameField = element.content
        else otherFields.push(element.content)
      }
      return (
        <>
          {longDescription}
          <div className={className}>
            <div className="name-field">{nameField}</div>
            <div className="data-fields">
              {otherFields.map((element) => element)}
            </div>
          </div>
        </>
      )
    } // ugly layout

    return (
      <>
        {longDescription}
        <div className={className}>
          {props.properties
            .filter(
              (element) =>
                element.name !== 'enabled' ||
                ['compact', 'root'].includes(props.schema.layout)
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

  if (['compact', 'root', 'expanded'].includes(props.schema.layout))
    return fields

  // In case of "pseudo-dicts" (array of objects with a "name" attribute)
  // use the "name" attributeas the title

  let title = props.title
  if ('name' in props.schema.properties) {
    let label = null
    if ('label' in props.schema.properties) label = props.formData.label
    title = label || props.formData.name || (
      <span className="new-object">Unnamed item</span>
    )
  }

  return (
    <SettingsPanel
      objId={objId}
      onClick={() => {
        if (props.formContext.onSetBreadcrumbs)
          props.formContext.onSetBreadcrumbs(path)
      }}
      title={title}
      description={shortDescription}
      contextMenuModel={contextMenuModel}
      className={`obj-override-${overrideLevel}`}
      enabledToggler={enabledToggler}
    >
      {fields}
    </SettingsPanel>
  )
}

function FieldTemplate(props) {
  const contextMenuRef = useRef(null)
  const divider = useMemo(() => {
    if (props.schema.section)
      return (
        <Divider>
          {props.schema.section !== '---' && (
            <span className="p-tag">{props.schema.section}</span>
          )}
        </Divider>
      )
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

  //
  // Solve overrides for lists and leaves
  //

  const override = props.formContext.overrides
    ? props.formContext.overrides[props.id]
    : null

  const fieldChanged = props.formContext.changedKeys.includes(props.id)
  const overrideLevel = fieldChanged
    ? 'edit'
    : override
    ? override.level
    : 'default'

  let labelStyle = {}
  let rmOverrideFunc = null
  let pinOverrideFunc = null

  if (override) {
    if (override?.inGroup) labelStyle.fontStyle = 'italic'
    else if (override.level === props.formContext.level)
      rmOverrideFunc = () => {
        const path = override.path
        props.formContext.onDeleteOverride(path)
      }
  }

  if (!override || override.level !== props.formContext.level) {
    pinOverrideFunc = () => {
      const path = override.path
      props.formContext.onPinOverride(path)
    }
  }

  // Context menu

  const contextMenuModel = buildContextMenu(rmOverrideFunc, pinOverrideFunc)

  // Array fields

  if (
    props.schema.type === 'array' &&
    props.schema.items.type !== 'string' &&
    props.schema.layout !== 'compact'
  ) {
    let className

    for (const childId of props.formContext.changedKeys) {
      if (!childId.startsWith(`${props.id}_`)) continue // not a child of this object
      className = 'obj-override-edit group-changed'
      break
    }

    if (!className) className = `obj-override-${overrideLevel}`

    return (
      <SettingsPanel
        objId={props.id}
        title={props.schema.title}
        description={props.schema.description}
        className={className}
        contextMenuModel={contextMenuModel}
        onClick={() => {
          if (props.formContext.onSetBreadcrumbs && override?.path)
            props.formContext.onSetBreadcrumbs(override.path)
        }}
      >
        {props.children}
      </SettingsPanel>
    )
  }

  // Leaves

  const widgetClass =
    props.schema.type === 'array' &&
    props.schema.layout === 'compact' &&
    props.formData?.length
      ? 'left-border'
      : ''

  return (
    <>
      {divider}
      <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
      <div
        onContextMenu={(e) => contextMenuRef.current.show(e)}
        className={`form-inline-field p-inputgroup ${
          props.errors.props.errors ? 'error' : ''
        }`}
      >
        {props.label && (
          <div
            className={`form-inline-field-label ${
              props.rawDescription ? 'field-label' : ''
            } ${overrideLevel}`}
            data-pr-tooltip={`${
              props.rawDescription ? props.rawDescription : ''
            }`}
          >
            <span
              onClick={() => {
                if (props.formContext.onSetBreadcrumbs)
                  props.formContext.onSetBreadcrumbs(override.path)
              }}
              style={labelStyle}
            >
              {props.label}
            </span>
          </div>
        )}
        <div className={`form-inline-field-widget ${widgetClass}`}>
          {props.children}
        </div>
        <div className="form-inline-field-help">
          {props.rawDescription ? <div>{props.rawDescription}</div> : ''}
        </div>
      </div>
    </>
  )
}

const ArrayItemTemplate = (props) => {
  const rmButton = props.hasRemove && (
    <div className="array-item-controls">
      <Button
        onClick={props.onDropIndexClick(props.index)}
        className="p-button-danger p-button-outlined settings-rm-button"
        icon="pi pi-times"
      />
      <Button
        onClick={props.onReorderClick(props.index, props.index - 1)}
        className="p-button-success p-button-outlined settings-up-button"
        icon="pi pi-arrow-up"
      />
      <Button
        onClick={props.onReorderClick(props.index, props.index + 1)}
        className="p-button-success p-button-outlined settings-down-button"
        icon="pi pi-arrow-down"
      />
    </div>
  )

  return (
    <div className="form-array-field-item">
      {props.children}
      {rmButton}
    </div>
  )
}

const ArrayFieldTemplate = (props) => {
  /* Complete array including the add button */
  return (
    <div className="form-array-field">
      {props.items.map((element) => (
        <ArrayItemTemplate key={element.name} {...element} />
      ))}
      {props.canAdd && (
        <div className="settings-add-button">
          <Button
            onClick={props.onAddClick}
            icon="pi pi-plus"
            className="p-button-success p-button-outlined"
          />
        </div>
      )}
    </div>
  )
}

export { ObjectFieldTemplate, FieldTemplate, ArrayFieldTemplate }
