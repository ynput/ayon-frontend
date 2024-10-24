import { useState, useEffect } from 'react'
import { Dropdown } from '@ynput/ayon-react-components'

import { updateChangedKeys, equiv, parseContext } from '../helpers'
import { $Any } from '@types'

const SelectWidget = (props: $Any) => {
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

  const onFocus = (e: $Any) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  const tooltip = []
  if (props.rawErrors) {
    for (const err of props.rawErrors) tooltip.push(err)
  }

  let hlstyle: $Any = {}
  if (!equiv(value, props.multiple ? props.value || [] : props.value)) {
    hlstyle.outline = '1px solid yellow'
  } else if (originalValue && !equiv(props.value, originalValue)) {
    hlstyle.outline = '1px solid var(--color-changed)'
  }

  let renderableValue: $Any
  if (value === null) {
    renderableValue = []
  } else if (props.multiple) {
    renderableValue = value
  } else {
    renderableValue = [value]
  }

  return (
    <Dropdown
      widthExpand
      options={options}
      value={renderableValue}
      // @ts-ignore
      onSelectionChange={props.multiple ? setValue : (e) => setValue(e[0])}
      onBlur={props.onBlur}
      onFocus={onFocus}
      placeholder={props.schema?.placeholder}
      className={`form-field`}
      multiSelect={props.multiple}
      style={hlstyle}
      disabled={props.schema?.disabled}
    />
  )
}

export { SelectWidget }
