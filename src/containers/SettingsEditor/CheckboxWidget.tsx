import { useState, useEffect } from 'react'
import { InputSwitch } from '@ynput/ayon-react-components'

import { updateChangedKeys, parseContext } from './helpers'
import { $Any } from '@types'

const CheckboxWidget = function (props: $Any) {
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

  const onChange = (e: $Any) => {
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

export { CheckboxWidget }
