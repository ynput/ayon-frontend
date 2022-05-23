import { useState, useEffect } from 'react'
import Form from '@rjsf/core'

import { Panel } from 'primereact/panel'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'
import { TextWidget, SelectWidget, CheckboxWidget } from './widgets'

import './index.sass'



const SettingsPanel = ({objId, title, description, children, layout}) => {
  // const [expandedObjects, setExpandedObjects] = useLocalStorage('expanded-settings-keys', [])
  //
  // const onToggle = (e) => {
  //   if (expandedObjects.includes(objId))
  //     setExpandedObjects(expandedObjects.filter(id => id !== objId))
  //   else
  //     setExpandedObjects([...expandedObjects, objId])
  // }

  const [expanded, setExpanded] = useState(false)
  //!expandedObjects.includes(objId)

  useEffect(() => {
    return () => {
      console.log('unmounting panel', objId)
    }
  }, [])

  const onToggle = () => {
    setExpanded(!expanded)
  }


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
  const overrides = props.formData.__overrides__ || {}

  let className = ""
  if (props.schema.layout)
    className = `form-object-field layout-${props.schema.layout}`

  const fields = (
    <div className={className}>
      {props.properties.map((element, index) => (
        <div key={index} className={`form-object-field-item ${overrides[element.name] || ''}`} >
        {element.content}
        </div>
      ))}
    </div>
  )
  
  if (["compact", "root"].includes(props.schema.layout))
    return fields


  const objId = props.idSchema.$id

  let title = props.title
  if (props.formData.name)
    title = props.formData.name

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


  if (props.schema.type == "object"){
    return (
      <>
        {divider}
        {props.children}
      </>
    )
  }

  if(props.schema.type == "array"){
    return (
      <SettingsPanel
        objId={props.id}
        title={props.schema.title}
      > 
        {props.children}
      </SettingsPanel>
    )

  }

  return (
    <>
    {divider}
    <div className={`form-inline-field ${props.errors.props.errors ? 'error' : ''}`}>
      {props.label && <div className="form-inline-field-label">{props.label}</div>}
      <div className="form-inline-field-widget">{props.children}</div>
    </div>
    </>
  )

}





const ArrayItemTemplate = (props) => {
  const rmButton = props.hasRemove && (
    <Button
      onClick={props.onDropIndexClick(props.index)}
      className="p-button-danger p-button-text"
      icon="pi pi-times"
      style={{ marginLeft: '.5em 0', height: '30px' }}
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
    "ui:FieldTemplate": (props) => (
      <div className="form-root-object">
        {props.children}
      </div>
    ),
  }

  return (
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
  )
}

export default SettingsEditor
