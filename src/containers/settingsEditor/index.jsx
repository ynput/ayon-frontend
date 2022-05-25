import { useEffect } from 'react'
import Form from '@rjsf/core'

import { Panel } from 'primereact/panel'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'
import { TextWidget, SelectWidget, CheckboxWidget } from './widgets'
import { Tooltip } from 'primereact/tooltip'
import { useLocalStorage, arrayEquals } from '../../utils'


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



const isChanged = (current, override) => {
  if (Array.isArray(current)){
    return !arrayEquals(current, override)
  }
  if (typeof current !== 'object') {
    return current !== override
  }
  for (const key in current){
    if (["__overrides__", "__changes__"].includes(key))
      continue

    if (isChanged(current[key], current.__overrides__[key].value))
      return true
  }
  return false
}




function ObjectFieldTemplate(props) {
  const overrides = props.formData.__overrides__ || {}
  const override_levels = {}
  //const changes = []

  let className = ""
  let changed = false
  if (props.schema.layout)
    className = `form-object-field layout-${props.schema.layout}`

  for (const key in props.formData){
    if (key === "__overrides__")
      continue

    if (!overrides[key])
      continue

    if (overrides[key].level)
      override_levels[key] = overrides[key].level

    if (isChanged(props.formData[key], overrides[key].value)){
      override_levels[key] = "edit"
      overrides[key].changed = true
      changed = true
    }
    else
      overrides[key].changed = false
  }

  if (changed && props.schema.isgroup)
    className += " group-changed"


  const fields = (
    <div className={className}>
      {props.properties.map((element, index) => {
        
        return (
          <div key={index} className={`form-object-field-item ${override_levels[element.name] || ''}`} >
            {element.content}
          </div>
      )

      })}
    </div>
  )
  
  if (["compact", "root"].includes(props.schema.layout))
    return fields


  const objId = props.idSchema.$id

  let title = `${props.title} ${props.schema.isgroup ? 'group' : ''}`
  if (props.formData.name)
    title = props.formData.name

  let revertButton = <></>
  /*
  if (props.schema.isgroup && changes.length > 0)
    revertButton = <Button 
      label="revert"
      onClick={() => {
        console.log(props)
        if (props.formData.__changes__)
          delete props.formData.__changes__
        //for (const key in props.formData.__overrides__){
        //  console.log("revert", key, "to", props.formData.__overrides__[key].value)
        //  props.formData[key] = props.formData.__overrides__[key].value
        //}
       
        for (const element of props.properties){
          const nval = props.formData.__overrides__[element.name].value
          console.log("revert", element.name, "to", nval)
          element.content.props.onChange(nval)
        }


      }}
    />
  */

  //    onClick={() => console.log(props)}
  //    onClick={() => props.onChange({...props.formData.__overrides__.value, __overrides__: props.formData.__overrides__})}

  return (
    <SettingsPanel
      objId={objId}
      title={title}
      description={props.description}
      revertButton={revertButton}
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
          {props.label}
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


const SettingsEditor = ({schema, formData, onChange}) => {
  useEffect(() => {
    return () => {
      console.log('unmounting form')
    }
  }, [])

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

  return (
    <>
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
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
