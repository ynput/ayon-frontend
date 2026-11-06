import { useState, useEffect } from 'react'
import { InputDate } from '@ynput/ayon-react-components'

import { updateChangedKeys, parseContext } from '../helpers'
import { $Any } from '@types'

// react-datepicker creates this element under the body when it's missing
const DATE_PICKER_PORTAL_ID = 'settings-date-picker-portal'
const fieldProps: $Any = { className: 'form-field' }

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

  // the flat layout keeps each row in its own stacking context, which would put the
  // calendar under the rows below it: it opens in a portal instead
  const portalId = props.formContext?.flatLayout ? DATE_PICKER_PORTAL_ID : undefined

  return (
    <InputDate
      {...fieldProps}
      selected={value || undefined}
      onChange={onChange}
      onFocus={onFocus}
      portalId={portalId}
    />
  )
}

export { DateTimeWidget }
