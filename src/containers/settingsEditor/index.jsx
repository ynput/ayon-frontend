import { useMemo } from 'react'
import Form from '@rjsf/core'

import { Panel } from 'primereact/panel'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'
import { TextWidget, SelectWidget, CheckboxWidget } from './widgets'
import { Tooltip } from 'primereact/tooltip'

import { useLocalStorage  } from '../../utils'
import { isEqual } from 'lodash'


import './index.sass'

const SettingsPanel = ({objId, title, description, children, layout, revertButton}) => {
  const [expandedObjects, setExpandedObjects] = useLocalStorage('expanded-settings-keys', [])

  const onToggle = (e) => {
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

  let className = ""
  if (layout)
    className = `form-object-field layout-${layout}`

  return (
    <Panel 
      headerTemplate={panelHeaderTemplate} 
      onToggle={onToggle}
      toggleable 
      collapsed={!expanded}
      transitionOptions={{timeout: 0}}
      className={className}
    >
      {children}
    </Panel>
  )

}


function ObjectFieldTemplate(props) {

  let className = ""
  if (props.schema.layout)
    className = `form-object-field layout-${props.schema.layout}`

  //
  // Highlight overrides and changed fields
  //

  // check if the group is overriden
  // if so, apply "group-changed" class to the object field, 
  // which will cause all fields to be highlighted

  const objId = props.idSchema.$id
  if (props.formContext.overrides){
    const override = props.formContext.overrides[objId]
    if (override && override.type === "group"){
      if (!isEqual(props.formData, override.value)){
          className += " group-changed"
      }
    }
  }

  // apply the override level to each field
  // of the object, also check if the field is the field is changed

  const overrideLevels = useMemo(() => {
    const result = {}
    for (const key in props.formData){
      const schemaId = props.idSchema[key].$id
      if (schemaId && props.formContext.overrides && props.formContext.overrides[schemaId]){
        const override = props.formContext.overrides[schemaId]
        result[key] = override.level
        if (!isEqual(props.formData[key], override.value)){
          result[key] = "edit"
        }
      }
      // else if (props.schema.properties[key] && props.schema.properties[key].type !== "object"){
      //   result[key] = "project"
      // }
    }
    return result
  }, [props.formData, props.idSchema, props.formContext.overrides])

  // memoize the fields

  const fields = useMemo(() => (
    <div className={className}>
      {props.properties.map((element, index) => {
        return (
          <div key={index} className={`form-object-field-item ${overrideLevels[element.name] || ''}`} >
            {element.content}
          </div>
      )
      })}
    </div>
  ), [props.properties, className, overrideLevels])
  

  // aaand... render

  if (["compact", "root"].includes(props.schema.layout))
    return fields

  // In case of "pseudo-dicts" (array of objects with a "name" attribute)
  // use the "name" attribute as the title

  let title = props.title
  if (Object.keys(props.schema.properties).includes("name")){
    title = props.formData.name || <span className="new-object">Unnamed item</span>
  }

  return (
    <SettingsPanel
      objId={objId}
      title={title}
      description={props.description}
    >
      {fields}
    </SettingsPanel>
  )
}



function FieldTemplate(props) {
  let divider = <></>
  if (props.schema.section)
    divider = <Divider><span className="p-tag">{props.schema.section}</span></Divider>

  if (props.schema.type === "object"){
    return (
      <>
        {divider}
        {props.children}
      </>
    )
  }

  if(props.schema.type === "array"){
    return (
      <SettingsPanel
        objId={props.id}
        title={props.schema.title}
        description={props.schema.description}
      > 
        {props.children}
      </SettingsPanel>
    )

  }

  return (
    <>
    {divider}
    <div className={`form-inline-field p-inputgroup ${props.errors.props.errors ? 'error' : ''}`}>
      {props.label && (
        <div 
          className={`form-inline-field-label ${ props.rawDescription ? 'field-label' : ''}`}
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
            <Button onClick={props.onAddClick} icon="pi pi-plus" label="Add"/>
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


const SettingsEditor = ({schema, formData, onChange, overrides}) => {
  if (!schema) {
    return <div>Loading schema...</div>
  }

  // Just close the top-level object to a simple div
  const uiSchema = {
    "ui://FieldTemplate": (props) => (
      <div className="form-root-object">
        {props.children}
      </div>
    ),
  }

  const formContext = {
    overrides
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
