import { useMemo } from 'react'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'

import SettingsPanel from './settingsPanel'

function ObjectFieldTemplate(props) {
  let className = 'form-object-field'
  if (props.schema.layout) className += ` layout-${props.schema.layout}`

  // Highlight overrides and changed fields

  const objId = props.idSchema.$id
  const path =
    props.formContext.overrides[objId] &&
    props.formContext.overrides[objId].path

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

  // memoize the fields

  const fields = useMemo(() => {
    if (props.schema.layout === 'expanded') {
      let nameField = null
      let otherFields = []

      for (const element of props.properties) {
        if (element.name === 'name') nameField = element.content
        else otherFields.push(element.content)
      }
      return (
        <div className={className}>
          <div className="name-field">{nameField}</div>
          <div className="data-fields">
            {otherFields.map((element) => element)}
          </div>
        </div>
      )
    } // ugly layout

    return (
      <div className={className}>
        {props.properties.map((element, index) => {
          return (
            <div key={index} className="form-object-field-item">
              {element.content}
            </div>
          )
        })}
      </div>
    )
  }, [props.properties, className])

  // aaand... render

  if (['compact', 'root', 'expanded'].includes(props.schema.layout))
    return fields

  // In case of "pseudo-dicts" (array of objects with a "name" attribute)
  // use the "name" attribute as the title

  let title = props.title
  if (Object.keys(props.schema.properties).includes('name')) {
    let label = null
    if (Object.keys(props.schema.properties).includes('label'))
      label = props.formData.label
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
      description={props.description}
      className={`obj-override-${overrideLevel}`}
    >
      {fields}
    </SettingsPanel>
  )
}

function FieldTemplate(props) {
  const divider = useMemo(() => {
    if (props.schema.section)
      return (
        <Divider>
          <span className="p-tag">{props.schema.section}</span>
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

  // Array fields

  if (props.schema.type === 'array') {
    let overrideLevel = 'default'
    let path = null

    const overrides = props.formContext.overrides
    if (overrides && overrides[props.id]) {
      overrideLevel = overrides[props.id].level
      path = overrides[props.id].path
    }

    for (const childId of props.formContext.changedKeys) {
      if (!childId.startsWith(`${props.id}_`)) continue // not a child of this object
      overrideLevel = 'edit group-changed'
      break
    }

    return (
      <SettingsPanel
        objId={props.id}
        title={props.schema.title}
        description={props.schema.description}
        className={`obj-override-${overrideLevel}`}
        onClick={() => {
          if (props.formContext.onSetBreadcrumbs)
            props.formContext.onSetBreadcrumbs(path)
        }}
      >
        {props.children}
      </SettingsPanel>
    )
  }

  // Leaves

  const overrides = props.formContext.overrides
    ? props.formContext.overrides[props.id]
    : null
  const fieldChanged = props.formContext.changedKeys.includes(props.id)
  const overrideLevel = fieldChanged
    ? 'edit'
    : overrides
    ? overrides.level
    : 'default'

  return (
    <>
      {divider}
      <div
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
                  props.formContext.onSetBreadcrumbs(overrides.path)
              }}
            >
              {props.label}
            </span>
          </div>
        )}
        <div className="form-inline-field-widget">{props.children}</div>
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
