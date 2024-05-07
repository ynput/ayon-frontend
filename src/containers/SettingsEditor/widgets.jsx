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

import { isEqual } from 'lodash'

const updateChangedKeys = (props, changed, path) => {
  if (!props.formContext) return // WARN! (but shouldn't happen)
  if (!path?.length) return // WARN!
  props.formContext.onSetChangedKeys([{ path, isChanged: changed }])
}

const equiv = (a, b) => {
  if (typeof a !== typeof b) return false

  if (typeof a === 'object' && a?.length) {
    if (a?.length !== b?.length) return false
    // compare two arrays. return true if they contain the same elements
    // order doesn't matter
    if (a.length !== b.length) return false
    for (const i of a) {
      if (!b.includes(i)) return false
    }
    return true
  }

  return isEqual(a, b)
}

const parseContext = (props) => {
  const result = { originalValue: undefined, path: [] }
  if (props.formContext?.overrides && props.formContext.overrides[props.id]) {
    result.originalValue = props.formContext.overrides[props.id].originalValue
    result.path = props.formContext.overrides[props.id].path
  }
  return result
}

const CheckboxWidget = function (props) {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Initial push to formData
    // Used when the item is a part of an array
    // and it is newly added
    if (!props.onChange) return
    if (value === null) return
    if (value === props.value) return
    if (initialized) return

    setInitialized(true)
    if (path?.length) return
    setTimeout(() => {
      props.onChange(value)
    }, 300)
  }, [props.onChange, value])

  useEffect(() => {
    //console.log(props.id, props.value, value)
    // Sync the local state with the formData
    if (props.value === undefined) return
    if (value === props.value) return
    setValue(props.value || false)
  }, [props.value])

  useEffect(() => {
    // When a switch is switched, update the formData
    // and the changed keys.
    // Also set the breadcrumbs

    // we don't want to push the data directly in onChange,
    // because we want to first update the widget.
    // Value propagation can wait

    if (!props.onChange) return
    if (value === null) return
    if (value === props.value) return
    // this timeout must be here. idk why. if not,
    // the value will be set to the original value or smth
    props.onChange(value)
    setTimeout(() => {
      const isChanged = value !== originalValue
      updateChangedKeys(props, isChanged, path)
      props.formContext?.onSetBreadcrumbs(path)
    }, 100)
  }, [value])

  const onChange = (e) => {
    const newValue = e.target.checked
    setValue(newValue)
  }

  return (
    <span style={value !== props.value ? { outline: '1px solid yellow' } : {}}>
      <InputSwitch checked={value || false} onChange={onChange} />
      {/* {JSON.stringify(props.value)} / {JSON.stringify(value)}  */}
    </span>
  )

  // For debugging
  /* 
  return (
    <>
      <InputSwitch checked={value || false} onChange={onChange} />
      {JSON.stringify(value)}
      {JSON.stringify(props.value) || 'und'}
    </>
  )
  */
}

const SelectWidget = (props) => {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Initial push to formData
    // Used when the item is a part of an array
    // and it is newly added
    if (!props.onChange) return
    if (value === null) return
    if (value === props.value) return
    if (initialized) return

    setInitialized(true)
    if (path?.length) return

    setTimeout(() => {
      props.onChange(value)
    }, 200)
  }, [props.onChange, value])

  useEffect(() => {
    // Sync the local state with the formData
    if (props.value === undefined) return
    if (equiv(value, props.value)) return
    setValue(props.value || (props.multiple ? [] : ''))
  }, [props.value])

  useEffect(() => {
    if (value === null) return
    const isChanged = !equiv(value, props.value)
    if (!isChanged) {
      return
    }
    props.onChange(value)
    setTimeout(() => {
      updateChangedKeys(props, !equiv(value, props.originalValue), path)
    }, 100)
  }, [value])

  const enumLabels = props.schema?.enumLabels || {}
  const options = []
  for (const opt of props.options.enumOptions) {
    const _value = opt.value
    const label = enumLabels[_value] || _value
    options.push({ label, value: _value })
  }

  const onFocus = (e) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  const tooltip = []
  if (props.rawErrors) {
    for (const err of props.rawErrors) tooltip.push(err)
  }

  const hlstyle = {}
  if (!equiv(value, props.multiple ? props.value || [] : props.value)) {
    hlstyle.outline = '1px solid yellow'
  } else if (originalValue && !equiv(props.value, originalValue)) {
    hlstyle.outline = '1px solid var(--color-changed)'
  }

  let renderableValue
  if (value === null) renderableValue = []
  else if (props.multiple) renderableValue = value
  else renderableValue = [value]

  return (
    <Dropdown
      widthExpand
      options={options}
      value={renderableValue}
      onSelectionChange={props.multiple ? setValue : (e) => setValue(e[0])}
      onBlur={props.onBlur}
      onFocus={onFocus}
      optionLabel="label"
      tooltipOptions={{ position: 'bottom' }}
      placeholder={props.schema?.placeholder}
      className={`form-field`}
      multiSelect={props.multiple}
      style={hlstyle}
      optionValue="value"
      disabled={props.schema?.disabled}
    />
  )
}

const getDefaultValue = (props) => {
  //console.log("Creating default value for", props.id)
  if (props.schema.widget === 'color' && !props.value) {
    if (props.schema.colorFormat === 'hex') return props.schema.colorAlpha ? '#00000000' : '#000000'
    return props.schema.colorAlpha ? [0, 0, 0, 0] : [0, 0, 0]
  }
  if (props.value !== undefined) return props.value
  if (props.schema.type === 'string') return ''
  if (props.schema.type === 'integer') return 0
}

const TextWidget = (props) => {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState(null)
  const [initialized, setInitialized] = useState(false)

  const doInitialPush = () => {
    // Initial push to formData
    // Used when the item is a part of an array
    // and it is newly added
    if (!props.onChange) return
    if (value === null) return
    if (value === props.value) return
    if (initialized) return

    //console.log("Initial push for", props.id, "with value", value)
    setInitialized(true)
    setTimeout(() => {
      props.onChange(value)
    }, 200)
  }

  useEffect(() => {
    // Sync the local state with the formData
    if (props.value === undefined) return
    if (equiv(value, props.value)) return
    //console.log("Syncing local state for", props.id, JSON.stringify(props.value))
    setValue(props.value)
  }, [props.value])

  const checkNumber = (o, v, t) => {
    // no value, return original
    if (v === '') return o || 0
    // type is integer
    if (t === 'integer') {
      const parsed = parseInt(v)
      return isNaN(parsed) ? 0 : parsed
    } else return v
  }

  const onChangeCommit = (type) => {
    let commitValue = value
    // if number is blank set to 0
    if (['integer', 'number'].includes(type))
      commitValue = checkNumber(originalValue, commitValue, type)

    if (commitValue === props.value) return
    const isChanged = commitValue !== originalValue
    props.onChange(commitValue)
    setTimeout(() => {
      updateChangedKeys(props, isChanged, path)
    }, 100)
  }

  const onChange = (newValue) => {
    setValue(newValue)
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
    } else {
      opts.step = 1
    }
    opts.value = value || ''
    if (props.schema.minimum !== undefined) opts.min = props.schema.minimum
    if (props.schema.maximum !== undefined) opts.max = props.schema.maximum
    if (props.schema.exclusiveMinimum !== undefined)
      opts.min = props.schema.exclusiveMinimum + opts.step
    if (props.schema.exclusiveMaximum !== undefined)
      opts.max = props.schema.exclusiveMaximum - opts.step
    opts.showButtons = true
    opts.useGrouping = false
    opts.onBlur = () => onChangeCommit(props.schema.type)
    opts.onChange = (e) => {
      const value = e.target.value
      const parsedValue = parseFloat(value)
      if (isNaN(parsedValue)) return onChange('')
      onChange(parsedValue)
    }
  } else if (props.schema.widget === 'color') {
    //
    // Color picker
    //
    Input = InputColor
    opts.value = value || getDefaultValue(props)
    opts.format = props.schema.colorFormat || 'hex'
    opts.alpha = props.schema.colorAlpha || false
    opts.onChange = (e) => {
      // internal state is handled by the color picker,
      // so we shouldn't need to debounce this
      updateChangedKeys(props, e.target.value !== originalValue, path)
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
    opts.value = value || ''
    opts.onBlur = onChangeCommit
    opts.onChange = (e) => {
      onChange(e.target.value)
    }
  } else if (props.schema.widget === 'hierarchy') {
    //const projectName = props.formContext?.headerProjectName
    Input = InputText
    opts.value = value || ''
    opts.onBlur = onChangeCommit
    opts.placeholder = `/path/to/folder`
    opts.onChange = (e) => {
      onChange(e.target.value)
    }
  } else {
    // Default text input
    Input = InputText
    opts.value = value || ''
    opts.onBlur = onChangeCommit
    opts.onChange = (e) => {
      onChange(e.target.value)
    }
  }

  // Disable propagation of enter key
  // to prevent form submission. Just commit the change instead.
  opts.onKeyDown = (e) => {
    if (Input === InputTextarea) return
    if (e.keyCode === 13) {
      e.preventDefault()
      e.stopPropagation()
      onChangeCommit()
    }
  }

  const onFocus = (e) => {
    doInitialPush()
    props.formContext.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  const hlstyle = {}
  if (value !== props.value) {
    if (!['color'].includes(props.schema.widget)) {
      hlstyle.outline = '1px solid yellow'
    }
  } else if (originalValue !== undefined && props.value !== originalValue)
    hlstyle.outline = '1px solid var(--color-changed)'

  return (
    <Input
      className={`form-field`}
      onFocus={onFocus}
      tooltip={tooltip.join('\n')}
      tooltipOptions={{ position: 'bottom' }}
      {...opts}
      style={hlstyle}
    />
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
    updateChangedKeys(props, isChanged, path)
  }

  return <InputDate selected={value || undefined} onChange={onChange} onFocus={onFocus} />
}

export { TextWidget, SelectWidget, CheckboxWidget, DateTimeWidget }
