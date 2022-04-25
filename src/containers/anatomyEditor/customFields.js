import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';


const PrimeInputText = (props) => {
  return (
    <InputText 
      style={{width: '100%'}}
      id={props.id}
      readOnly={props.readOnly}
      value={props.formData}
      onChange={(event) => props.onChange(event.target.value || undefined)}
      onBlur={props.onBlur}
      onFocus={props.onFocus}
    />
  )
}


const PrimeInputNumber = (props) => {
  const sets = {}
  if (props.schema.exclusiveMinimum !== undefined)
    sets.min = props.schema.exclusiveMinimum + 1
  return (
    <InputNumber 
      style={{width: '100%'}}
      id={props.id}
      readOnly={props.readOnly}
      value={props.formData}
      onValueChange={(event) => props.onChange(event.value)}
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      showButtons={true}
      {...sets}
    />
  )
}


const PrimeMultiSelect = (props) => {
  console.log(props)
  const definitionName = props.schema.title
  const definition = props.registry.definitions[definitionName]
  let options = []

  if (definition && definition.enum) {
    const enmlist = definition.enum
    enmlist.sort()
    options = enmlist.map((value, index) => {
      return {
        label: value,
        value: value
      }
    })
  }

  return (
      <div className="settings-field">
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon settings-field-label">{props.schema.title}</span>
          <MultiSelect 
            style={{width: '100%'}}
            id={props.id}
            readOnly={props.readOnly}
            value={props.formData}
            options={options}
            onChange={(event) => props.onChange(event.value)}
            onBlur={props.onBlur}
            onFocus={props.onFocus}
            scrollHeight='400px'
            maxSelectedLabels={3}
          />
        </div>  
        <small className="p-error block">{props.rawErrors || <>&nbsp;</>}</small>
      </div>
  )

}


const customFields = {
  StringField: PrimeInputText,
  NumberField: PrimeInputNumber,
  multiselect: PrimeMultiSelect,
}


export default customFields
