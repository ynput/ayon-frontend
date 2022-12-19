import { useMemo } from 'react'
import {
  InputText,
  InputNumber,
  InputTextarea,
  InputSwitch,
  InputColor,
} from '@ynput/ayon-react-components'

import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'

const addDecimalPoint = (value) => {
  const valueString = value.toString(10)
  if (!valueString.match(/\./)) return valueString.concat('.0')
  else return valueString
}

const updateOverrides = (props, changed) => {
  if (!props.formContext) {
    return // WARN!
  }
  if (changed && !props.formContext.changedKeys.includes(props.id))
    props.formContext.changedKeys.push(props.id)
  else if (!changed && props.formContext.changedKeys.includes(props.id))
    props.formContext.changedKeys.splice(props.formContext.changedKeys.indexOf(props.id), 1)
  props.formContext?.onSetChangedKeys(props.formContext.changedKeys)
}

const parseContext = (props) => {
  const result = { originalValue: null, path: [] }
  if (props.formContext?.overrides && props.formContext.overrides[props.id]) {
    result.originalValue = props.formContext.overrides[props.id].value
    result.path = props.formContext.overrides[props.id].path
  }
  return result
}

const CheckboxWidget = function (props) {
  const { originalValue, path } = parseContext(props)

  const onChange = (e) => {
    updateOverrides(props, e.target.checked !== originalValue)
    props.onChange(e.target.checked)
    props.formContext?.onSetBreadcrumbs(path)
  }

  return <InputSwitch checked={props.value} onChange={onChange} />
}

const SelectWidget = (props) => {
  const { originalValue, path } = parseContext(props)
  const enumLabels = props.schema?.enumLabels || {}
  const options = []
  for (const opt of props.options.enumOptions) {
    const value = opt.value
    const label = enumLabels[value] || value
    options.push({ label, value })
  }

  // Ensure the value is in the options
  let value
  if (props.multiple) {
    value = props.value || []
    value = value.filter((v) => options.find((o) => o.value === v))
  } else {
    value = props.value || ''
    if (!options.find((o) => o.value === value)) value = ''
  }

  const tooltip = []
  if (props.rawErrors) {
    for (const err of props.rawErrors) tooltip.push(err)
  }

  const onChange = (e) => {
    updateOverrides(props, e.value !== originalValue)
    props.onChange(e.value)
  }

  const onFocus = (e) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  if (props.multiple) {
    return (
      <>
        <MultiSelect
          options={options}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={props.schema?.placeholder}
          disabled={props.schema?.disabled}
          className={`form-field ${props.rawErrors?.length ? 'p-invalid error' : ''}`}
        />
      </>
    )
  }

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      onBlur={props.onBlur}
      onFocus={onFocus}
      optionLabel="label"
      optionValue="value"
      tooltip={tooltip.join('\n')}
      tooltipOptions={{ position: 'bottom' }}
      placeholder={props.schema?.placeholder}
      disabled={props.schema?.disabled}
      className={`form-field ${props.rawErrors?.length ? 'p-invalid error' : ''}`}
    />
  )
}

const TextWidget = (props) => {
  const { originalValue, path } = parseContext(props)
  const tooltip = []
  if (props.rawErrors?.length) {
    for (const err of props.rawErrors) tooltip.push(err)
  }
  // hack for string arrays. to prevent null value passed to the
  // input text widget handled as uncontrolled input
  const value = useMemo(() => props.value || '', [props.value])

  let Input = null
  const opts = {
    placeholder: props.schema?.placeholder || '',
    disabled:
      props.schema.readonly ||
      props.schema.disabled ||
      (props.schema.fixedValue && props.schema.fixedValue === value),
  }

  //
  // Numeric input
  //

  if (['integer', 'number'].includes(props.schema.type)) {
    Input = InputNumber
    if (props.schema.type === 'number') {
      opts.step = 0.1
      opts.value = addDecimalPoint(value)
    } else {
      opts.value = value
      opts.step = 1
    }
    if (props.schema.minimum !== undefined) opts.min = props.schema.minimum
    if (props.schema.maximum !== undefined) opts.max = props.schema.maximum
    if (props.schema.exclusiveMinimum !== undefined)
      opts.min = props.schema.exclusiveMinimum + opts.step
    if (props.schema.exclusiveMaximum !== undefined)
      opts.max = props.schema.exclusiveMaximum - opts.step
    opts.showButtons = true
    opts.useGrouping = false
    opts.onChange = (e) => {
      updateOverrides(props, e.value !== originalValue)
      props.onChange(e.target.value)
    }

    //
    // Color picker
    //
  } else if (props.schema.widget === 'color') {
    Input = InputColor
    opts.value = value
    opts.format = props.schema.colorFormat || 'hex'
    opts.alpha = props.schema.colorAlpha || false
    opts.onChange = (e) => {
      updateOverrides(props, e.target.value !== originalValue)
      props.onChange(e.target.value)
    }

    //
    // Textarea
    //
  } else if (props.schema.widget === 'textarea') {
    Input = InputTextarea
    opts.autoResize = true
    opts.rows = 8
    opts.value = value
    opts.onChange = (e) => {
      updateOverrides(props, e.target.value !== originalValue)
      props.onChange(e.target.value)
    }
  } else {
    Input = InputText
    opts.value = value
    opts.onChange = (e) => {
      updateOverrides(props, e.target.value !== originalValue)
      props.onChange(e.target.value)
    }
  }

  const onFocus = (e) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  return (
    <>
      <Input
        className={`form-field ${props.rawErrors?.length ? 'p-invalid error' : ''}`}
        onBlur={props.onBlur}
        onFocus={onFocus}
        tooltip={tooltip.join('\n')}
        tooltipOptions={{ position: 'bottom' }}
        {...opts}
      />
      {/*JSON.stringify(value)*/}
    </>
  )
}

export { TextWidget, SelectWidget, CheckboxWidget }
