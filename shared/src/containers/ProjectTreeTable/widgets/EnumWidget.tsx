import { Dropdown, DropdownProps, DropdownRef } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { WidgetBaseProps } from './CellWidget'
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
    valueAsStrings.forEach((val) => {
      if (!options.find((option) => option.value === val)) {
        selectedOptions = [
          ...selectedOptions,
          {
            label: val,
            value: val,
            color: enableCustomValues
              ? 'var(--md-sys-color-surface-container)'
              : 'var(--md-sys-color-error)',
            icon: enableCustomValues ? undefined : 'warning',
          },
        ]
      }
    })
    const hasMultipleValues = selectedOptions.length > 1

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
      if (dropdownOpen) {
        const optionsUlEl = dropdownRef.current?.getOptions() as HTMLUListElement
        const firstItem = optionsUlEl?.querySelector('li')
        if (firstItem) {
          firstItem.focus()
          // set style of li to have no outline (no focus ring)
          firstItem.style.outline = 'none'
        }
      }
    }, [dropdownOpen])

    const isMultiSelect = !!type?.includes('list')

    const handleChange = (value: string[]) => {
      const filteredValue = enableCustomValues
        ? value
        : value.filter((v) => options.find((o) => o.value === v))

      if (type?.includes('list')) {
        onChange(filteredValue, 'Click')
      } else {
        // take first value as the type is not list]
        onChange(filteredValue[0], 'Click')
      }
    }

    if (isEditing) {
      return (
        <StyledDropdown
          options={options}
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
          {...dropdownProps}
          onChange={handleChange}
          onClose={onCancelEdit}
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
