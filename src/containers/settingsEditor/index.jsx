import { useMemo } from 'react'
import Form from '@rjsf/core'

import { Panel } from 'primereact/panel'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'
import { TextWidget, SelectWidget, CheckboxWidget } from './widgets'
import { Tooltip } from 'primereact/tooltip'

import { useLocalStorage  } from '../../utils'
import './index.sass'


const SettingsPanel = ({objId, title, description, children, layout, revertButton, className=""}) => {
  const [expandedObjects, setExpandedObjects] = useLocalStorage('expanded-settings-keys', [])

  const onToggle = () => {
    if (expandedObjects.includes(objId))
      setExpandedObjects(expandedObjects.filter(id => id !== objId))
    else
      setExpandedObjects([...expandedObjects, objId])
  }

  const expanded = expandedObjects.includes(objId)

  const panelHeaderTemplate = (options) => {
      const toggleIcon = options.collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down';
      return (
        <div className="p-panel-header form-panel-header" style={{justifyContent:"start", alignItems:"center"}}>
          <button className={options.togglerClassName} onClick={options.onTogglerClick}>
              <span className={toggleIcon}></span>
          </button>
          <h4>{title}</h4>
          <div style={{flex:1}}></div>
          <small>{description}</small>
          {revertButton && revertButton}  
        </div>
      )
  }

  let nclass = `form-object-field ${layout ? `layout-${layout}` : ''} ${className ||''} `

  return (
    <Panel 
      headerTemplate={panelHeaderTemplate} 
      onToggle={onToggle}
      toggleable 
      collapsed={!expanded}
      transitionOptions={{timeout: 0}}
      className={nclass}
    >
      {children}
    </Panel>
  )
}


function ObjectFieldTemplate(props) {
  let className = "form-object-field"
  if (props.schema.layout)
    className += ` layout-${props.schema.layout}`

  // Highlight overrides and changed fields

  const objId = props.idSchema.$id

  let overrideLevel = useMemo(() => {
    let res = "default"
    for (const childId in props.formContext.overrides) {
      if (!childId.startsWith(`${objId}_`))
        continue // not a child of this object
      const child = props.formContext.overrides[childId]

      if (props.formContext.changedKeys.includes(childId)){
        res = "edit"
        break
      }

      if (child.level === "studio" && res === "default")
        res = "studio"
      else if (child.level === "project" && res !== "edit")
        res = "project"
    }
    return res
    // form data's here, because formContext.overrides is not triggered :/
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [{...props.formContext.overrides}, [...props.formContext.changedKeys], objId, props.formData])

  if (props.schema.isgroup && overrideLevel === "edit"){
    className += " group-changed"
  }     

  // memoize the fields

  const fields = useMemo(() => (
    <div className={className}>
      {props.properties.map((element, index) => {
        return (
          <div key={index} className="form-object-field-item">
            {element.content}
          </div>
      )
      })}
    </div>
  ), [props.properties, className])
  
  // aaand... render

  if (["compact", "root"].includes(props.schema.layout))
    return fields

  // In case of "pseudo-dicts" (array of objects with a "name" attribute)
  // use the "name" attribute as the title

  let title = props.title
  if (Object.keys(props.schema.properties).includes("name")){
    let label = null
    if (Object.keys(props.schema.properties).includes("label"))
      label = props.formData.label
    title = label || props.formData.name || <span className="new-object">Unnamed item</span>
  }

  return (
    <SettingsPanel
      objId={objId}
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
    else
      return <></>
  }, [props.schema.section])

  // Object fields

  if (props.schema.type === "object"){
    return (
      <>
        {divider}
        {props.children}
      </>
    )
  }

  // Array fields

  if(props.schema.type === "array"){
    let overrideLevel = "default"

    const overrides = props.formContext.overrides
    if (overrides && overrides[props.id]){
      overrideLevel = overrides[props.id].level
    }

    for (const childId of props.formContext.changedKeys) {
      if (!childId.startsWith(`${props.id}_`))
        continue // not a child of this object
      overrideLevel = "edit group-changed"
      break
    }

    return (
      <SettingsPanel
        objId={props.id}
        title={props.schema.title}
        description={props.schema.description}
        className={`obj-override-${overrideLevel}`}
      > 
        {props.children}
      </SettingsPanel>
    )
  }

  // Leaves

  const overrides = props.formContext.overrides ? props.formContext.overrides[props.id] : null
  const fieldChanged = props.formContext.changedKeys.includes(props.id) 
  const overrideLevel = fieldChanged ? 'edit' : (overrides ? overrides.level : 'default')

  return (
    <>
    {divider}
    <div className={`form-inline-field p-inputgroup ${props.errors.props.errors ? 'error' : ''}`}>
      {props.label && (
        <div 
          className={`form-inline-field-label ${ props.rawDescription ? 'field-label' : ''} ${overrideLevel}`}
          data-pr-tooltip={`${props.rawDescription ? props.rawDescription : ''}`}
        >
          <span>
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
    <Button
      onClick={props.onDropIndexClick(props.index)}
      className="p-button-danger p-button-outlined settings-rm-button"
      icon="pi pi-times"
    />
  )

  return (
    <div className="form-array-field-item" >
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
              label="Add"
              className="p-button p-button-outlined"
            />
          </div>
        )}
    </div>
  )
}


const widgets = {
  TextWidget,
  SelectWidget,
  CheckboxWidget,
}


// Just close the top-level object to a simple div
const uiSchema = {
  "ui:FieldTemplate": (props) => (
    <div className="form-root-field">
      {props.children}
    </div>
  ),
}


const SettingsEditor = ({schema, formData, onChange, overrides}) => {
  if (!schema) {
    return <div>Loading schema...</div>
  }

  const formContext = {
    overrides: overrides || {},
    changedKeys: [],
  }

  return (
    <>
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      formContext={formContext}
      widgets={widgets}
      liveValidate={true}
      FieldTemplate={FieldTemplate}
      ObjectFieldTemplate={ObjectFieldTemplate}
      ArrayFieldTemplate={ArrayFieldTemplate}
      onChange={(evt) => onChange(evt.formData)}
      children={<></>}
    />
      <Tooltip target=".form-inline-field-label" />
    </>
  )
}

export default SettingsEditor
