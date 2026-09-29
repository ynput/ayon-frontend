import { useState, useEffect, useMemo } from 'react'
import { DefaultItemTemplate, Dropdown, InputSwitch } from '@ynput/ayon-react-components'

import { updateChangedKeys, equiv, parseContext } from '../helpers'
import { $Any } from '@types'
import styled from 'styled-components'
import OrderedListWidget from './OrderedListWidget'
import { isEqual } from 'lodash'
import { useAttributeEnumOptions } from '@shared/hooks/useAttributeEnumOptions'
import {
  getEnumErrorText,
  getEnumItemIcon,
  getSelectableEnumItems,
  isEnumIconImage,
  toDropdownErrorText,
} from '@shared/util/attributeEnum'

const StyledDropdown = styled(Dropdown)`
  max-width: 800px;
  button > div > div:has(span) {
    width: 0;
  }
`

const EnumOptionImage = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
`

// The library's default item template renders `option.icon` through its material-symbols
// <Icon>, which can't display an IconModel{type: 'url'} icon - render those as <img> instead.
const enumItemTemplate = (
  option: $Any,
  isActive: boolean,
  isSelected: boolean,
  _index: number,
  mixedSelected: string[],
  multiSelect?: boolean,
) => {
  const isImage = isEnumIconImage(option.icon)
  return (
    <DefaultItemTemplate
      option={isImage ? { ...option, icon: undefined } : option}
      dataKey="value"
      labelKey="label"
      selected={isSelected ? [option.value] : []}
      mixedSelected={mixedSelected}
      value={isActive ? [option.value] : []}
      multiSelect={multiSelect}
      startContent={isImage ? <EnumOptionImage src={option.icon} alt="" /> : undefined}
    />
  )
}

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

const SwitchboxMessage = styled.div`
  font-size: 12px;
  color: var(--md-sys-color-outline);
`

const Switchbox = ({ options, value, onSelectionChange, message }: $Any) => {
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
      {message && <SwitchboxMessage>{message}</SwitchboxMessage>}
      {options.length > 0 && (
        <SwitchboxButtonGroup>
          <SwitchboxButton onClick={selectAll} disabled={allSelected} title="Select all options">
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <InputSwitch
              checked={isSelected(opt.value)}
              onChange={() => toggleSelection(opt.value)}
            />
            <label style={{ whiteSpace: 'nowrap' }}>{opt.label}</label>
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


  const enumResolverName = props.schema && props.schema['x-enum-resolver']
  const enumResolverSettings = props.schema && props.schema['x-enum-resolver-settings']

  const enumResolverData = useMemo(
    () =>
      enumResolverName
        ? { enumResolver: enumResolverName, enumResolverSettings }
        : undefined,
    [enumResolverName, enumResolverSettings],
  )

  // Project/site scoped settings must always resolve enums with a project_name; if it
  // is not known yet, wait rather than fetching studio-wide (and possibly wrong) options.
  const settingsLevel = props.formContext?.level
  const headerProjectName = props.formContext?.headerProjectName
  const requiresProjectScope = settingsLevel === 'project' || settingsLevel === 'site'

  const {
    options: resolvedEnumOptions,
    isLoading: isEnumOptionsLoading,
    isError: isEnumOptionsError,
    errorMessage: enumOptionsErrorMessage,
  } = useAttributeEnumOptions(enumResolverData, {
    projectName: headerProjectName,
    skip: !enumResolverName || (requiresProjectScope && !headerProjectName),
  })

  const enumOptionsError = isEnumOptionsError ? getEnumErrorText(enumOptionsErrorMessage) : undefined


  useEffect(() => {
    // Sync the local state with the formData
    // For sortable multiselect, order matters - use isEqual instead of equiv
    const eq = isSortableMultiselect ? isEqual(value, props.value) : equiv(value, props.value)
    if (eq) {
      return
    }

    let defaultValue
    if (props.multiple) {
      defaultValue = props.schema['default'] || []
    } else {
      defaultValue = props.schema['default'] || ''
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

  let options: { label: string; value: $Any; icon?: string; color?: string }[]
  if (enumResolverName) {
    // Backend-resolved options carry their own labels; enumLabels only applies to static enums.
    // icon/color are rendered natively by Dropdown's default item/value templates.
    const selectedValues = Array.isArray(value) ? value : value !== null ? [value] : []
    options = getSelectableEnumItems(resolvedEnumOptions, selectedValues).map((opt) => ({
      label: opt.label,
      value: opt.value,
      icon: getEnumItemIcon(opt.icon),
      color: opt.color,
    }))
  } else {
    const enumLabels = props.schema?.enumLabels || {}
    options = []
    for (const opt of props.options.enumOptions) {
      const _value = opt.value
      const label = enumLabels[_value] || _value
      options.push({ label, value: _value })
    }
  }

  // Only pay for the custom item template when an option actually has an image icon;
  // otherwise the library's own material-symbols item rendering is used as-is.
  const hasImageIcon = options.some((opt) => isEnumIconImage(opt.icon))
  const itemTemplate = hasImageIcon
    ? (option: $Any, isActive: boolean, isSelected: boolean, index: number, mixedSelected: string[]) =>
        enumItemTemplate(option, isActive, isSelected, index, mixedSelected, props.multiple)
    : undefined

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

  const placeholder = enumOptionsError
    ? 'Could not load options'
    : isEnumOptionsLoading
    ? 'Loading options...'
    : props.schema?.placeholder
  const disabled = props.schema?.disabled || isEnumOptionsLoading

  if (isSortableMultiselect && props.multiple) {
    return (
      <OrderedListWidget
        value={(value as string[]) || []}
        options={options}
        onChange={setValue as (value: string[]) => void}
        placeholder={placeholder}
        disabled={disabled}
        dropdownProps={{ error: toDropdownErrorText(enumOptionsError), itemTemplate }}
      />
    )
  }

  if (widget === 'switchbox' && props.multiple) {
    return (
      <Switchbox
        options={options}
        value={value}
        onSelectionChange={setValue}
        message={enumOptionsError || (isEnumOptionsLoading ? 'Loading options...' : undefined)}
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
      placeholder={placeholder}
      error={toDropdownErrorText(enumOptionsError)}
      itemTemplate={itemTemplate}
      className={`form-field`}
      multiSelect={props.multiple}
      style={hlstyle}
      disabled={disabled}
      onSelectAll={
        props.multiple && options.length > 10
          ? () => setValue(options.map((opt) => opt.value))
          : undefined
      }
      valueIconMode="all"
    />
  )
}

export { SelectWidget }
