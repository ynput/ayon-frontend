import { Fieldset } from 'primereact/fieldset'
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'


const panelHeaderTemplate = (options) => {
    const toggleIcon = options.collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down';
    const className = `${options.className} justify-content-start`;
    const titleClassName = `${options.titleClassName} pl-1`;

    return (
        <div className={className}>
            <button className={options.togglerClassName} onClick={options.onTogglerClick}>
                <span className={toggleIcon}></span>
            </button>
            <span className={titleClassName}>
              {options.titleElement}
            </span>
            <div style={{flexGrow: 1}} />
            <Button 
              onClick={options.props.onRemoveClick}
              className={`p-button-danger p-button-text`}
              icon="pi pi-times"
            />
        </div>
    )
}


const ArrayItem = (props) => {
  const name = props.children.props.formData.name

  const rmButton = props.hasRemove && (<Button 
    onClick={props.onDropIndexClick(props.index)} 
    className="p-button-danger p-button-text" 
    icon="pi pi-times"
    style={{marginLeft: '.5em'}}
  />)

  const legend = <>{name} {rmButton}</>

  return (
    <Panel 
      toggleable
      collapsed={name !== undefined}
      header={name || <span className="p-error">Unnamed template</span>}
      headerTemplate={panelHeaderTemplate}
      onRemoveClick={props.onDropIndexClick(props.index)}
      style={{ 
        marginBottom: '1em',
      }}
    >
      {props.children} 
    </Panel>
  )
}


const ObjectFieldTemplate = (props) => {
  /* One element (row) of the array. Child of CompactListArrayItem */
  /* Basically removes the default fieldset */
  return (
    <div>
      {props.properties.map(element => element.content)}
    </div>
  )
}




function ArrayFieldTemplate(props) {
  /* Template group */

  let legend = props.title
  if (props.canAdd) {
    legend = (<>
      {props.title}
      <Button 
        onClick={props.onAddClick} 
        className="p-button-success p-button-text" 
        icon="pi pi-plus"
        style={{marginLeft: '.5em'}}
      />
      </>)
  }

  return (
    <Fieldset legend={legend} style={{ marginBottom: 16}}>
      {props.items.map(element => <ArrayItem key={element.name} {...element}/>)}
    </Fieldset>
  );
}

const templateGroupUiSchema ={
  "ui:ArrayFieldTemplate": ArrayFieldTemplate,
  "items": {
    "ui:ObjectFieldTemplate": ObjectFieldTemplate,
  }
}

export default templateGroupUiSchema
