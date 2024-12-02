import { useState, useEffect } from 'react'
import { InputSwitch } from '@ynput/ayon-react-components'

import { updateChangedKeys, parseContext, getDefaultValue } from '../helpers'
import { $Any } from '@types'

const CheckboxWidget = function (props: $Any) {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState(props.value || getDefaultValue(props))

  useEffect(() => {
    // Sync the local state with the formData
    if (value === props.value) {
      return
    }

    setValue(
      props.value !== null && props.value !== undefined ? props.value : getDefaultValue(props),
    )
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
    if (props.value === undefined && value === getDefaultValue(props)) {
      return
    }
    // this timeout must be here. idk why. if not,
    // the value will be set to the original value or smth
    props.onChange(value)
    setTimeout(() => {
      const isChanged = value !== originalValue
      updateChangedKeys(props, isChanged, path)
      props.formContext?.onSetBreadcrumbs(path)
    }, 100)
  }, [value])

  const onChange = (e: $Any) => {
    const newValue = e.target.checked
    setValue(newValue)
  }

  return (
    <span>
      <InputSwitch checked={value || false} onChange={onChange} />
    </span>
  )
}

export { CheckboxWidget }
