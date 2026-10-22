import {
  IconSelect,
  InputColor,
  InputNumber,
  InputText,
  InputTextarea,
} from '@ynput/ayon-react-components'
import { $Any } from '@types'
import { getDefaultValue, updateChangedKeys } from '../helpers'
import { PermissionWidget, SettingsCodeEditor } from './TextWidgetInputs'

type TextWidgetInputConfigArgs = {
  props: $Any
  value: $Any
  originalValue: $Any
  path: $Any
  onChange: (value: $Any) => void
  onChangeCommit: (type?: $Any) => void
}

const checkNumber = (originalValue: $Any, value: $Any, type: $Any) => {
  if (value === '') return originalValue || 0
  if (type === 'integer') {
    const parsed = parseInt(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return value
}

export const getTextWidgetInputConfig = ({
  props,
  value,
  originalValue,
  path,
  onChange,
  onChangeCommit,
}: TextWidgetInputConfigArgs) => {
  let Input = null
  let isPlainText = false
  const opts: $Any = {
    placeholder: props.schema?.placeholder || '',
    disabled:
      props.schema.readonly ||
      props.schema.disabled ||
      (props.schema.fixedValue && props.schema.fixedValue === value),
  }

  if (['integer', 'number'].includes(props.schema.type)) {
    if (props.schema.widget === 'permission') {
      Input = PermissionWidget
      opts.value = value || 0
      opts.setValue = (nextValue: $Any) => {
        updateChangedKeys(props, nextValue !== originalValue, path)
        props.onChange(nextValue)
      }
    } else {
      Input = InputNumber
      opts.value = value !== null && value !== undefined ? value : getDefaultValue(props)
      opts.onBlur = () => onChangeCommit(props.schema.type)
      opts.onChange = (event: $Any) => {
        if (!/^-?\d*\.?\d*$/.test(event.target.value)) return
        onChange(event.target.value)
      }
    }
  } else if (props.schema.widget === 'color') {
    Input = InputColor
    opts.value = value !== null && value !== undefined ? value : getDefaultValue(props)
    opts.format = props.schema.colorFormat || 'hex'
    opts.alpha = props.schema.colorAlpha || false
    opts.onChange = (event: $Any) => {
      updateChangedKeys(props, event.target.value !== originalValue, path)
      props.onChange(event.target.value)
    }
  } else if (props.schema.widget === 'icon') {
    Input = IconSelect
    opts.value = value ? [value] : []
    opts.onChange = (nextValue: $Any) => props.onChange(nextValue[0])
  } else if (props.schema.widget === 'label') {
    Input = InputText
    opts.value = value || ''
    opts.disabled = true
    opts.onChange = (event: $Any) => onChange(event.target.value)
  } else if (props.schema.widget === 'textarea' && props.schema.syntax) {
    Input = SettingsCodeEditor
    opts.wrap = 'false'
    opts.value = value || ''
    opts.language = props.schema.syntax || 'plaintext'
    opts.onBlur = onChangeCommit
    opts.onChange = (event: $Any) => onChange(event.target.value)
  } else if (props.schema.widget === 'textarea') {
    Input = InputTextarea
    opts.rows = props.formContext?.flatLayout ? 3 : 8
    opts.value = value || ''
    opts.onBlur = onChangeCommit
    opts.onChange = (event: $Any) => onChange(event.target.value)
  } else if (props.schema.widget === 'hierarchy') {
    Input = InputText
    opts.value = value || ''
    opts.onBlur = onChangeCommit
    opts.placeholder = '/path/to/folder'
    opts.onChange = (event: $Any) => onChange(event.target.value)
  } else {
    isPlainText = true
    Input = InputText
    opts.value = value !== null && value !== undefined ? value : getDefaultValue(props)
    opts.onBlur = onChangeCommit
    opts.onChange = (event: $Any) => onChange(event.target.value)
  }

  return { Input, opts, isPlainText }
}

export { checkNumber }
