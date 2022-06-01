import { useMemo } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { InputNumber } from 'primereact/inputnumber'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'

const updateOverrides = (props, changed) => {
  if (changed && !props.formContext.changedKeys.includes(props.id))
    props.formContext.changedKeys.push(props.id)
  else if (!changed && props.formContext.changedKeys.includes(props.id))
    props.formContext.changedKeys.splice(
      props.formContext.changedKeys.indexOf(props.id),
      1
    )
}

const getDefaultValue = (props) => {
  if (props.formContext.overrides && props.formContext.overrides[props.id])
    return props.formContext.overrides[props.id].value
  return null
}

const CheckboxWidget = function (props) {
  const originalValue = getDefaultValue(props)

  const onChange = (e) => {
    updateOverrides(props, e.value !== originalValue)
    props.onChange(e.value)
  }

  return <InputSwitch checked={props.value} onChange={onChange} />
}

const SelectWidget = (props) => {
  const originalValue = getDefaultValue(props)
  const options = props.options.enumOptions
  const tooltip = []
  if (props.rawErrors) {
    for (const err of props.rawErrors) tooltip.push(err)
  }
  const onChange = (e) => {
    updateOverrides(props, e.value !== originalValue)
    props.onChange(e.value)
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
      tooltipOptions={{ position: 'bottom' }}
    />
  )
}

const TextWidget = (props) => {
  const originalValue = getDefaultValue(props)
  const tooltip = []
  if (props.rawErrors) {
    for (const err of props.rawErrors) tooltip.push(err)
  }

  // hack for string arrays. to prevent null value passed to the
  // input text widget handled as uncontrolled input
  const value = useMemo(() => props.value || '', [props.value])

  let Input = null
  const opts = {}
  if (props.schema.type === 'integer') {
    Input = InputNumber
    opts.min = props.schema.minimum
    opts.max = props.schema.maximum
    opts.step = 1
    opts.showButtons = true
    opts.useGrouping = false
    opts.onChange = (e) => {
      updateOverrides(props, e.value !== originalValue)
      props.onChange(e.value)
    }
  } else if (props.schema.widget === 'textarea') {
    Input = InputTextarea
    opts.autoResize = true
    opts.rows = 5
    opts.onChange = (e) => {
      updateOverrides(props, e.target.value !== originalValue)
      props.onChange(e.target.value)
    }
  } else {
    Input = InputText
    opts.onChange = (e) => {
      updateOverrides(props, e.target.value !== originalValue)
      props.onChange(e.target.value)
    }
  }

  return (
    <Input
      className={
        props.rawErrors && props.rawErrors.length > 0 ? 'p-invalid' : ''
      }
      value={value}
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      tooltip={tooltip.join('\n')}
      tooltipOptions={{ position: 'bottom' }}
      {...opts}
    />
  )
}

export { TextWidget, SelectWidget, CheckboxWidget }
