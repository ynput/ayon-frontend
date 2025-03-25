import { useState, useEffect } from 'react'
import { InputDate } from '@ynput/ayon-react-components'

import { updateChangedKeys, parseContext } from '../helpers'
import { $Any } from '@types'

const DateTimeWidget = (props: $Any) => {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState<Date | null | undefined>(null)

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

  const onFocus = (e: $Any) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  const onChange = (value: Date) => {
    setValue(value)
    const newValue = value.toISOString()
    if (newValue === props.value) {
      return
    }

    const isChanged = newValue !== originalValue
    props.onChange(newValue)
    props.formContext?.onSetBreadcrumbs(path)
    updateChangedKeys(props, isChanged, path)
  }

  // @ts-ignore
  return <InputDate className="form-field" selected={value || undefined} onChange={onChange} onFocus={onFocus} />
}

export { DateTimeWidget }
