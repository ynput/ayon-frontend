import {Button} from 'primereact/button';


const CompactListArrayItem = (props) => {
  const rmButton = props.hasRemove && (<Button 
    onClick={props.onDropIndexClick(props.index)} 
    className="p-button-danger p-button-text" 
    icon="pi pi-times"
    style={{marginLeft: '.5em 0', height: '30px'}}
  />)

  return (
  <div style={{ display: 'flex', alignItems: 'top' }}>
    {props.children}
    {rmButton}
  </div>
  )
}


const CompactListObjectFieldTemplate = (props) => {
  /* One element (row) of the array. Child of CompactListArrayItem */
  /* Basically removes the default fieldset */
  return <>{props.properties.map(element => element.content)}</>
}


function CompactListArrayFieldTemplate(props) {
  /* Complete array including the add button */
  return (
    <>
      {props.items.map(element => <CompactListArrayItem key={element.name} {...element}/>)}
      {props.canAdd && <div className="settings-add-button">
          <Button onClick={props.onAddClick} label="Add" icon="pi pi-plus" />
      </div>}
    </>
  );
}


const MyFieldTemplate = (props) => {
  /* One cell of the row */
  return (
      <div className="settings-compact-row">
        {props.description}
        {props.children}
        {props.help}
      </div>
  )
}


const compactListUiSchema = {
    "ui:ArrayFieldTemplate": CompactListArrayFieldTemplate,
    "items": {
      "ui:ObjectFieldTemplate": CompactListObjectFieldTemplate,
      "ui:FieldTemplate": MyFieldTemplate,
    }
}


export default compactListUiSchema
