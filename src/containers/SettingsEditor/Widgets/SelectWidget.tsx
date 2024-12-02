import { useState, useEffect } from 'react'
import { Dropdown } from '@ynput/ayon-react-components'

import { updateChangedKeys, equiv, parseContext } from '../helpers'
import { $Any } from '@types'
import styled from 'styled-components'

const StyledDropdown = styled(Dropdown)`
  button > div > div:has(span) {
    width: 0;
  }
`

const SelectWidget = (props: $Any) => {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState(null)

  useEffect(() => {
    // Sync the local state with the formData
    if (equiv(value, props.value)) {
      return
    }

    let defaultValue
    if (props.multiple) {
      defaultValue = props.schema.default || []
    } else {
      defaultValue = props.schema.default || ''
    }

    setValue(props.value !== null && props.value !== undefined ? props.value : defaultValue)
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
    // no one likes this :`-(
    // hlstyle.outline = '1px solid yellow'
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
    <StyledDropdown
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
