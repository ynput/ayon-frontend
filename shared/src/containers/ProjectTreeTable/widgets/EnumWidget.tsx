import { Dropdown, DropdownProps, DropdownRef } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import type { WidgetBaseProps } from './CellWidget'
import { AttributeData, AttributeEnumItem } from '../types'
import { EnumCellValue, EnumTemplateProps } from './EnumCellValue'

const StyledDropdown = styled(Dropdown)`
  height: 100%;
  width: 100%;
`

export interface EnumWidgetProps
  extends Omit<DropdownProps, 'onChange' | 'value'>,
    WidgetBaseProps {
  value: (string | number | boolean)[]
  options: AttributeEnumItem[]
  type?: AttributeData['type']
  autoOpen?: boolean
  isReadOnly?: boolean
  enableCustomValues?: boolean
  pt?: {
    template?: Partial<EnumTemplateProps>
  }
  onOpen?: () => void
  onNext?: () => void
}

export const EnumWidget = forwardRef<HTMLDivElement, EnumWidgetProps>(
  (
    {
      value,
      isEditing,
      options,
      type,
      autoOpen = true,
      isReadOnly,
      enableCustomValues,
      onOpen,
      onChange,
      onCancelEdit,
      onNext,
      pt,
      ...dropdownProps
    },
    _ref,
  ) => {
    // convert value to string array
    const valueAsStrings = value.map((v) => v?.toString()).filter((v) => !!v)
    let selectedOptions = options.filter((option) =>
      valueAsStrings.includes(option.value.toString()),
    )

    // Check if all values are present in options, if not, add a warning
    const invalidOptions: AttributeEnumItem[] = []
    valueAsStrings.forEach((val) => {
      if (!options.find((option) => option.value === val)) {
        const invalidOption = {
          label: val,
          value: val,
          color: enableCustomValues
            ? 'var(--md-sys-color-surface-container)'
            : 'var(--md-sys-color-error)',
          icon: enableCustomValues ? undefined : 'warning',
        }
        selectedOptions = [...selectedOptions, invalidOption]
        invalidOptions.push(invalidOption)
      }
    })
    const hasMultipleValues = selectedOptions.length > 1

    // Merge valid options with invalid options for the dropdown
    const allOptions = [...options, ...invalidOptions]

    const dropdownRef = useRef<DropdownRef>(null)

    const [dropdownOpen, setDropdownOpen] = useState(false)
    useEffect(() => {
      if (isEditing && dropdownRef.current && autoOpen) {
        !dropdownRef.current.isOpen && dropdownRef.current?.open()
        setDropdownOpen(true)
      } else {
        setDropdownOpen(false)
      }
    }, [isEditing, dropdownRef.current, autoOpen])

    // when the dropdown is open, focus the first item
    useEffect(() => {
      if (dropdownOpen && !dropdownProps.search && allOptions.length < 20) {
        const optionsUlEl = dropdownRef.current?.getOptions() as HTMLUListElement
        const firstItem = optionsUlEl?.querySelector('li')
        if (firstItem) {
          firstItem.focus()
          // set style of li to have no outline (no focus ring)
          firstItem.style.outline = 'none'
        }
      }
    }, [dropdownOpen, dropdownProps.search, allOptions.length])

    const isMultiSelect = !!type?.includes('list')

    const handleChange = (value: string[]) => {
      let filteredValue: string | string[] = enableCustomValues
        ? value
        : value.filter((v) => options.find((o) => o.value === v))
      if (type?.includes('list')) {
        onChange(filteredValue, 'Click')
      } else {
        // check if the value is an array or a string and for arrays take the first value only
        filteredValue = Array.isArray(filteredValue) ? filteredValue[0] : filteredValue

        // take first value as the type is not list]
        onChange(filteredValue, 'Click')
      }
    }

    if (isEditing) {
      return (
        <StyledDropdown
          options={allOptions}
          value={valueAsStrings}
          ref={dropdownRef}
          valueTemplate={(_value, selected, isOpen) => (
            <EnumCellValue
              selectedOptions={selectedOptions}
              hasMultipleValues={selected.length > 1}
              isOpen={isOpen}
              isReadOnly={isReadOnly}
              isMultiSelect={isMultiSelect}
              {...pt?.template}
              placeholder={dropdownProps.placeholder}
              className={clsx('enum-dropdown-value', pt?.template?.className)}
            />
          )}
          itemTemplate={(option, _isActive, isSelected) => (
            <EnumCellValue
              selectedOptions={[option]}
              hasMultipleValues={false}
              isOpen={false}
              isItem
              isMultiSelect={isMultiSelect}
              isSelected={isSelected}
              {...pt?.template}
              className={clsx('enum-dropdown-item', pt?.template?.className)}
            />
          )}
          widthExpand
          multiSelect={isMultiSelect}
          disableOpen={isReadOnly}
          disabled={isReadOnly}
          sortBySelected
          searchOnNumber={10}
          {...dropdownProps}
          onChange={handleChange}
          onClose={onCancelEdit}
          editable={enableCustomValues}
        />
      )
    }

    return (
      <EnumCellValue
        selectedOptions={selectedOptions}
        hasMultipleValues={hasMultipleValues}
        isMultiSelect={isMultiSelect}
        isReadOnly={isReadOnly}
        {...pt?.template}
        placeholder={dropdownProps.placeholder}
        className={clsx('enum-value', pt?.template?.className, dropdownProps.className)}
      />
    )
  },
)
