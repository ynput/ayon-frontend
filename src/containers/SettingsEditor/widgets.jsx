import { useState, useEffect } from 'react'
import {
  Dropdown,
  InputText,
  InputNumber,
  InputTextarea,
  InputSwitch,
  InputColor,
  InputDate,
  IconSelect,
} from '@ynput/ayon-react-components'

import arrayEquals from '/src/helpers/arrayEquals'

const addDecimalPoint = (value) => {
  const valueString = value.toString(10)
  if (!valueString.match(/\./)) return valueString.concat('.0')
  else return valueString
}

const updateOverrides = (props, changed, path) => {
  if (!props.formContext) {
    return // WARN!
  }

  let newChangedKeys
  if (changed) {
    newChangedKeys = props.formContext?.changedKeys
      .filter((key) => !arrayEquals(key, path))
      .concat([path])
  } else {
    newChangedKeys = props.formContext?.changedKeys.filter((key) => !arrayEquals(key, path))
  }

  props.formContext.onSetChangedKeys(newChangedKeys)
}

const parseContext = (props) => {
  const result = { originalValue: null, path: [] }
  if (props.formContext?.overrides && props.formContext.overrides[props.id]) {
    result.originalValue = props.formContext.overrides[props.id].originalValue
    result.path = props.formContext.overrides[props.id].path
  }
  return result
}

const CheckboxWidget = function (props) {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState(null)

  useEffect(() => {
    setValue(props.value || false)
  }, [props.value])

  useEffect(() => {
    if (value === null) return
    if (value !== props.value) {
      props.onChange(value)
      // this timeout must be here. idk why. if not,
      // the value will be set to the original value or smth
      setTimeout(() => {
        const isChanged = value !== originalValue
        updateOverrides(props, isChanged, path)
        props.formContext?.onSetBreadcrumbs(path)
      }, 100)
    }
  }, [value])

  const onChange = (e) => {
    const newValue = e.target.checked
    setValue(newValue)
  }

  // we need value || false here. in the useeffect above
  // it is necessarty to check against null (which happens
  // right after the component is mounted), but during the
  // same render, we need the value here...

  return <InputSwitch checked={value || false} onChange={onChange} />
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

  const onChange = (value) => {
    updateOverrides(props, value !== originalValue, path)
    props.onChange(value)
  }

  const onFocus = (e) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  if (props.multiple) {
    return (
      <>
        <Dropdown
          multiSelect
          widthExpand
          options={options}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={props.schema?.placeholder}
          disabled={props.schema?.disabled}
          className={`form-field`}
        />
      </>
    )
  }

  return (
    <Dropdown
      widthExpand
      options={options}
      value={[value]}
      onChange={(e) => onChange(e[0])}
      onBlur={props.onBlur}
      onFocus={onFocus}
      optionLabel="label"
      optionValue="value"
      tooltip={tooltip.join('\n')}
      tooltipOptions={{ position: 'bottom' }}
      placeholder={props.schema?.placeholder}
      disabled={props.schema?.disabled}
      className={`form-field`}
    />
  )
}

const TextWidget = (props) => {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (props.schema.type === 'string' && props.schema.widget !== 'color')
      setValue(props.value || '')
    else if (props.schema.type === 'integer') setValue(props.value || 0)
    else setValue(props.value || false)
  }, [props.value])

  const onChange = (newValue) => {
    setValue(newValue)
  }

  const onChangeCommit = () => {
    if (value === props.value) return
    const isChanged = value !== originalValue
    props.onChange(value)
    props.formContext?.onSetBreadcrumbs(path)
    updateOverrides(props, isChanged, path)
  }

  const tooltip = []
  if (props.rawErrors?.length) {
    for (const err of props.rawErrors) tooltip.push(err)
  }

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
    opts.onBlur = onChangeCommit
    opts.onChange = (e) => {
      const newValue = parseFloat(e.target.value)
      onChange(newValue)
    }
  } else if (props.schema.widget === 'color') {
    //
    // Color picker
    //
    Input = InputColor
    opts.value = value
    opts.format = props.schema.colorFormat || 'hex'
    opts.alpha = props.schema.colorAlpha || false
    opts.onChange = (e) => {
      // internal state is handled by the color picker,
      // so we shouldn't need to debounce this
      updateOverrides(props, e.target.value !== originalValue, path)
      props.onChange(e.target.value)
    }
  } else if (props.schema.widget === 'icon') {
    Input = IconSelect

    opts.value = value ? [value] : []
    opts.onChange = (e) => {
      props.onChange(e[0])
    }
  } else if (props.schema.widget === 'textarea') {
    //
    // Textarea
    //
    Input = InputTextarea
    opts.autoResize = true
    opts.rows = 8
    opts.value = value
    opts.onBlur = onChangeCommit
    opts.onChange = (e) => {
      onChange(e.target.value)
    }

    //
    // Default text input
    //
  } else {
    Input = InputText
    opts.value = value
    opts.onBlur = onChangeCommit
    opts.onChange = (e) => {
      onChange(e.target.value)
    }
  }

  // Disable propagation of enter key
  // to prevent form submission. Just commit the change instead.
  opts.onKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault()
      e.stopPropagation()
      onChangeCommit()
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
        onFocus={onFocus}
        tooltip={tooltip.join('\n')}
        tooltipOptions={{ position: 'bottom' }}
        {...opts}
      />
    </>
  )
}

const DateTimeWidget = (props) => {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState(null)

  useEffect(() => {
    if (!props.value) {
      setValue(undefined)
      return
    }
    try {
      const date = new Date(props.value)
      setValue(date)
    } catch {
      setValue(undefined)
    }
  }, [props.value])

  const onFocus = (e) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  const onChange = (value) => {
    setValue(value)
    const newValue = value.toISOString()
    if (newValue === props.value) return
    const isChanged = newValue !== originalValue
    props.onChange(newValue)
    props.formContext?.onSetBreadcrumbs(path)
    updateOverrides(props, isChanged, path)
  }

  return <InputDate selected={value || undefined} onChange={onChange} onFocus={onFocus} />
}

export { TextWidget, SelectWidget, CheckboxWidget, DateTimeWidget }
