import React from 'react'
import CodeEditor from '@uiw/react-textarea-code-editor'
import { useEffect, useState } from 'react'
import { equiv, getDefaultValue, parseContext, updateChangedKeys } from '../helpers'
import { $Any } from '@types'
import {
  Button,
  IconSelect,
  InputColor,
  InputNumber,
  InputText,
  InputTextarea,
} from '@ynput/ayon-react-components'

import {CodeEditorWrapper} from '../styledComponents'

type PermissionWidgetProps = {
  value: number
  setValue: (value: number) => void
}


const SettingsCodeEditor = (props: $Any) => {
  return (
    <CodeEditorWrapper>
      <CodeEditor
        {...props}
      />
    </CodeEditorWrapper>
  )
}


const PermissionWidget: React.FC<PermissionWidgetProps> = ({ value, setValue }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
      <Button
        label="No access"
        onClick={() => setValue(0)}
        variant={!value ? 'danger' : 'surface'}
      />
      <Button
        label="Read only"
        onClick={() => setValue(1)}
        variant={value === 1 ? 'filled' : 'surface'}
      />
      <Button
        label="Read & Write"
        onClick={() => setValue(2)}
        variant={value === 2 ? 'tertiary' : 'surface'}
      />
    </div>
  )
}

export const TextWidget = (props: $Any) => {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState(null)
  const [valueInitialized, setValueInitialized] = useState(false)

  useEffect(() => {
    setValueInitialized(true)
    // Sync the local state with the formData
    if (props.value === undefined) {
      return
    }
    if (equiv(value, props.value)) {
      return
    }
    //console.log("Syncing local state for", props.id, JSON.stringify(props.value))
    setValue(props.value)
  }, [props.value])

  const checkNumber = (o: $Any, v: $Any, t: $Any) => {
    // no value, return original
    if (v === '') return o || 0
    // type is integer
    if (t === 'integer') {
      const parsed = parseInt(v)
      return isNaN(parsed) ? 0 : parsed
    } else return v
  }

  const onChangeCommit = (type?: $Any) => {
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

  const onChange = (newValue: $Any) => {
    setValue(newValue)
  }

  const tooltip = []
  if (props.rawErrors?.length) {
    for (const err of props.rawErrors) tooltip.push(err)
  }

  let Input = null
  let opts: $Any = {
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
    if (props.schema.widget === 'permission') {
      Input = PermissionWidget
      opts.value = value || 0
      opts.setValue = onChange
      opts.setValue = (e: $Any) => {
        // internal state is handled by the component,
        // so we shouldn't need to debounce this
        updateChangedKeys(props, e !== originalValue, path)
        props.onChange(e)
      }
    } else {
      Input = InputNumber
      opts.value = value !== null && value !== undefined ? value : getDefaultValue(props)
      // Not valid props - causing flooing of console
      // opts.showButtons = true
      // opts.useGrouping = false
      opts.onBlur = () => onChangeCommit(props.schema.type)
      opts.onChange = (e: $Any) => {
        // ensure that the value is a number. decimal points are allowed
        // but no other characters
        // use regex to check if the value is a number
        if (!/^-?\d*\.?\d*$/.test(e.target.value)) return
        onChange(e.target.value)
      }
    }
  } else if (props.schema.widget === 'color') {
    //
    // Color picker
    //
    Input = InputColor
    opts.value = value !== null && value !== undefined ? value : getDefaultValue(props)
    opts.format = props.schema.colorFormat || 'hex'
    opts.alpha = props.schema.colorAlpha || false
    opts.onChange = (e: $Any) => {
      // internal state is handled by the color picker,
      // so we shouldn't need to debounce this
      updateChangedKeys(props, e.target.value !== originalValue, path)
      props.onChange(e.target.value)
    }
  } else if (props.schema.widget === 'icon') {
    Input = IconSelect

    opts.value = value ? [value] : []
    opts.onChange = (e: $Any) => {
      props.onChange(e[0])
    }
  } else if (props.schema.widget === 'textarea' && props.schema.syntax) {
    
    Input = SettingsCodeEditor
    opts.wrap = "false"
    opts.value = value || ''
    opts.language = props.schema.syntax || 'plaintext'
    opts.onBlur = onChangeCommit
    opts.onChange = (e: $Any) => {
      onChange(e.target.value)
    }


  } else if (props.schema.widget === 'textarea') {
    //
    // Textarea
    //
    Input = InputTextarea
    opts.rows = 8
    opts.value = value || ''
    opts.onBlur = onChangeCommit
    opts.onChange = (e: $Any) => {
      onChange(e.target.value)
    }
  } else if (props.schema.widget === 'hierarchy') {
    //const projectName = props.formContext?.headerProjectName
    Input = InputText
    opts.value = value || ''
    opts.onBlur = onChangeCommit
    opts.placeholder = `/path/to/folder`
    opts.onChange = (e: $Any) => {
      onChange(e.target.value)
    }
  } else {
    // Default text input
    Input = InputText
    opts.value = value !== null && value !== undefined ? value : getDefaultValue(props)
    opts.onBlur = onChangeCommit
    opts.onChange = (e: $Any) => {
      onChange(e.target.value)
    }
  }

  // Disable propagation of enter key
  // to prevent form submission. Just commit the change instead.
  opts.onKeyDown = (e: $Any) => {
    if (Input === InputTextarea) return
    if (e.keyCode === 13) {
      e.preventDefault()
      e.stopPropagation()
      onChangeCommit()
    }
  }

  const onFocus = (e: $Any) => {
    props.formContext.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  const hlstyle: $Any = {}
  if (valueInitialized && value !== props.value) {
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

  return (
    <Input
      className={`form-field`}
      onFocus={onFocus}
      data-tooltip={tooltip?.length ? tooltip.join('\n') : undefined}
      {...opts}
      style={hlstyle}
    />
  )
}
