import { useEffect, useState } from 'react'
import { $Any } from '@types'
import { equiv, parseContext, updateChangedKeys } from '../helpers'
import { SettingsTemplateText } from './SettingsTemplateText'
import { SettingsTextFold } from './SettingsTextFold'
import { checkNumber, getTextWidgetInputConfig } from './TextWidgetHelpers'

export const TextWidget = (props: $Any) => {
  const { originalValue, path } = parseContext(props)
  // starts at the saved value, so a field doesn't read as changed before its first sync
  const [value, setValue] = useState<$Any>(props.value ?? null)

  useEffect(() => {
    if (props.value === undefined) return
    setValue((currentValue: $Any) => (equiv(currentValue, props.value) ? currentValue : props.value))
  }, [props.value])

  const onChangeCommit = (type?: $Any) => {
    let commitValue = value
    if (['integer', 'number'].includes(type))
      commitValue = checkNumber(originalValue, commitValue, type)

    if (commitValue === props.value) return
    const isChanged = commitValue !== originalValue
    props.onChange(commitValue)
    setTimeout(() => {
      updateChangedKeys(props, isChanged, path)
    }, 100)
  }

  const onChange = (newValue: $Any) => setValue(newValue)
  const { Input, opts, isPlainText } = getTextWidgetInputConfig({
    props,
    value,
    originalValue,
    path,
    onChange,
    onChangeCommit,
  })
  const isMultilineWidget = props.schema.widget === 'textarea'

  opts.onKeyDown = (event: $Any) => {
    if (isMultilineWidget) return
    if (event.keyCode === 13) {
      event.preventDefault()
      event.stopPropagation()
      onChangeCommit()
    }
  }

  const onFocus = (event: $Any) => {
    props.formContext.onSetBreadcrumbs(path)
    props.onFocus(event)
  }

  const hlstyle: $Any = {}
  if (value !== null && value !== props.value) {
    /* Fix #539: Disable yellow outline
       Yellow outline is confusing most users, so we're disabling it for now.
       However we may want to still highlight the value differences in another
       way.
    if (!['color'].includes(props.schema.widget)) {
      hlstyle.outline = '1px solid yellow'
    }
     */
  } else if (originalValue !== undefined && props.value !== originalValue)
    hlstyle.outline = '1px solid var(--color-changed)'

  const input = (
    <Input
      className="form-field"
      onFocus={onFocus}
      data-tooltip={props.rawErrors?.length ? props.rawErrors.join('\n') : undefined}
      {...opts}
      style={hlstyle}
    />
  )

  if (!props.formContext?.flatLayout) return input
  if (isPlainText) {
    return <SettingsTemplateText value={String(opts.value ?? '')}>{input}</SettingsTemplateText>
  }
  if (!isMultilineWidget) return input

  const changed = originalValue !== undefined && !equiv(value ?? '', originalValue ?? '')
  return <SettingsTextFold changed={changed}>{input}</SettingsTextFold>
}

export default TextWidget
