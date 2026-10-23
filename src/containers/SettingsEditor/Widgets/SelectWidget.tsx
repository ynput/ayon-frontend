import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import {
  DefaultItemTemplate,
  Dropdown,
  DropdownRef,
  InputSwitch,
} from '@ynput/ayon-react-components'
import { CSSProperties } from 'react'

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

const buildSelectOptions = ({
  enumResolverName,
  resolvedEnumOptions,
  value,
  schema,
  enumOptions,
}: $Any): $Any[] => {
  if (enumResolverName) {
    const selectedValues = Array.isArray(value) ? value : value !== null ? [value] : []
    return getSelectableEnumItems(resolvedEnumOptions, selectedValues).map((option: $Any) => ({
      label: option.label,
      value: option.value,
      icon: getEnumItemIcon(option.icon),
      color: option.color,
    }))
  }

  const enumLabels = schema?.enumLabels || {}
  return enumOptions.map((option: $Any) => ({
    label: enumLabels[option.value] || option.value,
    value: option.value,
  }))
}

const getRenderableValue = (value: $Any, multiple: boolean) => {
  if (value === null) return []
  return multiple ? value : [value]
}

const getHighlightStyle = (
  value: $Any,
  multiple: boolean,
  formValue: $Any,
  originalValue: $Any,
) => {
  const style: $Any = {}
  if (
    equiv(value, multiple ? formValue || [] : formValue) &&
    originalValue &&
    !equiv(formValue, originalValue)
  ) {
    style.outline = '1px solid var(--color-changed)'
  }
  return style
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
    <SwitchboxContainer className="settings-switchbox">
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
      <SwitchboxGrid className="settings-switchbox-options">
        {options.map((opt: any) => (
          <div
            key={opt.value}
            className="settings-switchbox-option"
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
  const valueChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<DropdownRef>(null)
  const [dropdownPlacement, setDropdownPlacement] = useState<CSSProperties>({})
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(300)
  const [dropdownHorizontalPlacement, setDropdownHorizontalPlacement] = useState<CSSProperties>({})

  const widget = props.schema?.widget
  // TODO: remove ID check once backend addon adds widget="sortable_multiselect" to schema
  const isSortableMultiselect =
    widget === 'sortable_multiselect' ||
    (props.multiple && /applications_profiles_\d+_applications$/.test(props.id))

  const enumResolverName = props.schema && props.schema['x-enum-resolver']
  const enumResolverSettings = props.schema && props.schema['x-enum-resolver-settings']

  const enumResolverData = useMemo(
    () => (enumResolverName ? { enumResolver: enumResolverName, enumResolverSettings } : undefined),
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

  const enumOptionsError = isEnumOptionsError
    ? getEnumErrorText(enumOptionsErrorMessage)
    : undefined

  const getDefaultValue = useCallback(
    () => props.schema['default'] || (props.multiple ? [] : ''),
    [props.multiple, props.schema],
  )
  const isMissing = props.value === null || props.value === undefined
  const formValue = props.value
  const value = isMissing ? getDefaultValue() : formValue

  useEffect(
    () => () => {
      if (valueChangeTimer.current) clearTimeout(valueChangeTimer.current)
    },
    [],
  )

  const handleValueChange = useCallback(
    (nextValue: $Any) => {
      if (nextValue === null) return

      const same = isSortableMultiselect ? isEqual : equiv
      if (isMissing && same(nextValue, getDefaultValue())) return
      if (same(nextValue, formValue)) return

      props.onChange(nextValue)
      if (valueChangeTimer.current) clearTimeout(valueChangeTimer.current)
      valueChangeTimer.current = setTimeout(() => {
        const origChanged = isSortableMultiselect
          ? !isEqual(nextValue, originalValue)
          : !equiv(nextValue, originalValue)
        updateChangedKeys(props, origChanged, path)
        valueChangeTimer.current = null
      }, 100)
    },
    [formValue, getDefaultValue, isMissing, isSortableMultiselect, originalValue, path, props],
  )

  const options = buildSelectOptions({
    enumResolverName,
    resolvedEnumOptions,
    value,
    schema: props.schema,
    enumOptions: props.options.enumOptions,
  })

  // Only pay for the custom item template when an option actually has an image icon;
  // otherwise the library's own material-symbols item rendering is used as-is.
  const hasImageIcon = options.some((opt) => isEnumIconImage(opt.icon))
  const itemTemplate = hasImageIcon
    ? (
        option: $Any,
        isActive: boolean,
        isSelected: boolean,
        index: number,
        mixedSelected: string[],
      ) => enumItemTemplate(option, isActive, isSelected, index, mixedSelected, props.multiple)
    : undefined

  const onFocus = (e: $Any) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  const onDropdownOpen = () => {
    const dropdown = dropdownRef.current?.getElement()
    const trigger = dropdown?.querySelector('button')
    if (!trigger) return

    const triggerRect = trigger.getBoundingClientRect()
    const spaceAbove = triggerRect.top - 10
    const spaceBelow = window.innerHeight - triggerRect.bottom - 10
    const opensUp = spaceAbove > spaceBelow
    const availableSpace = opensUp ? spaceAbove : spaceBelow

    setDropdownPlacement({
      top: opensUp ? triggerRect.top : triggerRect.bottom,
      translate: opensUp ? '0 -100%' : 'none',
      transformOrigin: opensUp ? 'center bottom' : 'center top',
    })
    setDropdownMaxHeight(Math.min(300, Math.max(80, availableSpace - 48)))

    requestAnimationFrame(() => {
      const menu = document.querySelector<HTMLElement>('.settings-select-dropdown-menu')
      if (!menu) return

      const optionsList = menu.querySelector<HTMLElement>('ul.options')
      const maxMenuWidth = window.innerWidth - 20
      const menuWidth = Math.min(
        maxMenuWidth,
        Math.max(triggerRect.width, optionsList?.scrollWidth || 0),
      )
      const spaceLeft = triggerRect.left - 10
      const spaceRight = window.innerWidth - triggerRect.right - 10
      const opensRight = spaceRight >= spaceLeft
      const desiredLeft = opensRight ? triggerRect.left : triggerRect.right - menuWidth
      const left = Math.max(10, Math.min(desiredLeft, window.innerWidth - menuWidth - 10))

      setDropdownHorizontalPlacement({ left, right: 'auto', width: menuWidth })
    })
  }

  const hlstyle = getHighlightStyle(value, props.multiple, formValue, originalValue)
  const renderableValue = getRenderableValue(value, props.multiple)

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
        onChange={handleValueChange}
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
        onSelectionChange={handleValueChange}
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
      onSelectionChange={props.multiple ? handleValueChange : (e) => handleValueChange(e[0])}
      onBlur={props.onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      error={toDropdownErrorText(enumOptionsError)}
      itemTemplate={itemTemplate}
      className={`form-field`}
      ref={dropdownRef}
      onOpen={onDropdownOpen}
      maxHeight={dropdownMaxHeight}
      itemStyle={{ whiteSpace: 'nowrap' }}
      listStyle={{ width: 'max-content', maxWidth: 'calc(100vw - 20px)' }}
      pt={{
        container: {
          className: 'settings-select-dropdown-menu',
          style: {
            width: 'max-content',
            maxWidth: 'calc(100vw - 20px)',
            ...dropdownPlacement,
            ...dropdownHorizontalPlacement,
          },
        },
        list: { style: { width: 'max-content', maxWidth: 'calc(100vw - 20px)' } },
      }}
      multiSelect={props.multiple}
      style={hlstyle}
      disabled={disabled}
      onSelectAll={
        props.multiple && options.length > 10
          ? () => handleValueChange(options.map((opt) => opt.value))
          : undefined
      }
      valueIconMode="all"
    />
  )
}

export { SelectWidget }
