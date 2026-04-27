import { useState, useEffect } from 'react'
import { Dropdown, InputSwitch } from '@ynput/ayon-react-components'

import { updateChangedKeys, equiv, parseContext } from '../helpers'
import { $Any } from '@types'
import styled from 'styled-components'
import OrderedListWidget from './OrderedListWidget'
import { isEqual } from 'lodash'

const StyledDropdown = styled(Dropdown)`
  button > div > div:has(span) {
    width: 0;
  }
`

const SwitchboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 800px;
`

const SwitchboxGrid = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px 16px;
`

const SwitchboxButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`

const SwitchboxButton = styled.button`
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-s);
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--md-sys-color-surface-container-highest);
    border-color: var(--md-sys-color-outline);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Switchbox = ({ options, value, onSelectionChange }: $Any) => {
  const isSelected = (val: $Any) => {
    if (Array.isArray(value)) {
      return value.includes(val)
    }
    return value === val
  }

  const toggleSelection = (val: $Any) => {
    if (Array.isArray(value)) {
      if (value.includes(val)) {
        onSelectionChange(value.filter((v: $Any) => v !== val))
      } else {
        onSelectionChange([...value, val])
      }
    } else {
      onSelectionChange(val)
    }
  }

  const selectAll = () => {
    if (Array.isArray(value)) {
      onSelectionChange(options.map((opt: any) => opt.value))
    }
  }

  const deselectAll = () => {
    if (Array.isArray(value)) {
      onSelectionChange([])
    }
  }

  const allSelected = Array.isArray(value) && value.length === options.length
  const noneSelected = Array.isArray(value) && value.length === 0

  return (
    <SwitchboxContainer>
      {options.length > 0 && (
        <SwitchboxButtonGroup>
          <SwitchboxButton
            onClick={selectAll}
            disabled={allSelected}
            title="Select all options"
          >
            Select All
          </SwitchboxButton>
          <SwitchboxButton
            onClick={deselectAll}
            disabled={noneSelected}
            title="Deselect all options"
          >
            Deselect All
          </SwitchboxButton>
        </SwitchboxButtonGroup>
      )}
      <SwitchboxGrid>
        {options.map((opt: any) => (
          <div
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <InputSwitch
              checked={isSelected(opt.value)}
              onChange={() => toggleSelection(opt.value)}
            />
            <label style={{whiteSpace:"nowrap"}}>{opt.label}</label>
          </div>
        ))}
      </SwitchboxGrid>
    </SwitchboxContainer>
  )

}



const SelectWidget = (props: $Any) => {
  const { originalValue, path } = parseContext(props)
  const [value, setValue] = useState<string[] | string | null>(null)

  const widget = props.schema?.widget
  // TODO: remove ID check once backend addon adds widget="sortable_multiselect" to schema
  const isSortableMultiselect =
    widget === 'sortable_multiselect' ||
    (props.multiple && /applications_profiles_\d+_applications$/.test(props.id))

  useEffect(() => {
    // Sync the local state with the formData
    // For sortable multiselect, order matters - use isEqual instead of equiv
    const eq = isSortableMultiselect ? isEqual(value, props.value) : equiv(value, props.value)
    if (eq) {
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
    const isChanged = isSortableMultiselect
      ? !isEqual(value, props.value)
      : !equiv(value, props.value)
    if (!isChanged) {
      return
    }
    props.onChange(value)
    setTimeout(() => {
      const origChanged = isSortableMultiselect
        ? !isEqual(value, originalValue)
        : !equiv(value, props.originalValue)
      updateChangedKeys(props, origChanged, path)
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

  if (isSortableMultiselect && props.multiple) {
    return (
      <OrderedListWidget
        value={(value as string[]) || []}
        options={options}
        onChange={setValue as (value: string[]) => void}
      />
    )
  }

  if (widget === 'switchbox' && props.multiple) {
    return (
      <Switchbox
        options={options}
        value={value}
        onSelectionChange={setValue}
      />
    )
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
      onSelectAll={
        props.multiple && props.options.enumOptions.length > 10
          ? () => setValue(props.options.enumOptions.map((opt: $Any) => opt.value))
          : undefined
      }
    />
  )
}

export { SelectWidget }
