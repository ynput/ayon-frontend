import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'


const CheckboxWidget = function(props) {
  return (
    <InputSwitch 
      checked={props.value} 
      onChange={(e) => props.onChange(e.value)}
    />
  )
}


const SelectWidget = (props) => {
  const options = props.options.enumOptions
  const tooltip = [];
  if (props.schema.description)
    tooltip.push(props.schema.description)
  else
    tooltip.push(props.schema.title)

  if (props.rawErrors){
    tooltip.push("")
    for (const err of props.rawErrors)
      tooltip.push(err)
  }
  const onChange = (e) => {
    props.onChange(e.value);
  }

  return (
    <Dropdown 
      options={options} 
      value={props.value} 
      onChange={onChange}
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      optionLabel="label"
      optionValue="value"
      tooltip={tooltip.join('\n')}
      tooltipOptions={{position: 'bottom'}}
    />
  )
}



const TextWidget = (props) => {
  const tooltip = [];
  if (props.schema.description)
    tooltip.push(props.schema.description)
  else
    tooltip.push(props.schema.title)

  if (props.rawErrors){
    tooltip.push("")
    for (const err of props.rawErrors)
      tooltip.push(err)
  }

  let Input = null
  const opts = {}
  if (props.schema.type === 'integer'){
    Input = InputNumber
    opts.min = props.schema.minimum
    opts.max = props.schema.maximum
    opts.step = 1
    opts.showButtons = true
    opts.onChange = (e) => props.onChange(e.value)
  }
  else{
    Input = InputText
    opts.onChange = (e) => props.onChange(e.target.value)
  }

  return (
    <Input
      className={props.rawErrors && props.rawErrors.length > 0 ? 'p-invalid' : ''}
      value={props.value}
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      tooltip={tooltip.join('\n')}
      tooltipOptions={{position: 'bottom'}}
      {...opts}
    />
  );
}

export { TextWidget, SelectWidget, CheckboxWidget }
