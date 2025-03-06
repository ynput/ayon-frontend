import { AttributeData, AttributeEnumItem } from '@api/rest/attributes'
import { Dropdown, DropdownRef, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef, useEffect, useRef } from 'react'
import styled from 'styled-components'

const StyledWidget = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius-m);
  padding: 0 2px;
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &.item {
    padding: 4px 2px;
    border-radius: 0;

    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }
`

const StyledValue = styled.span`
  /* push expand icon to the end */
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  text-overflow: ellipsis;
  text-align: left;
`

const StyledImg = styled.img`
  width: 20px;
  height: 20px;
  object-fit: cover;

  &.avatar {
    border-radius: 50%;
  }
`

const StyledExpandIcon = styled(Icon)`
  margin-left: auto;
  transition: rotate 0.2s;
`

const StyledDropdown = styled(Dropdown)`
  height: 100%;
  width: 100%;
`

interface EnumWidgetProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  value: (string | number | boolean)[]
  isEditing?: boolean
  options: AttributeEnumItem[]
  type?: AttributeData['type']
  onChange: (value: string | string[]) => void
}

const checkForImgSrc = (icon: string): boolean => {
  return (
    icon.startsWith('/') ||
    icon.startsWith('./') ||
    icon.startsWith('../') ||
    icon.startsWith('http://') ||
    icon.startsWith('https://')
  )
}

const checkAvatarImg = (src: string): boolean => src.includes('avatar')

export const EnumWidget = forwardRef<HTMLDivElement, EnumWidgetProps>(
  ({ value, isEditing, options, type, onChange }, _ref) => {
    // convert value to string array
    const valueAsStrings = value.map((v) => v?.toString())
    const selectedOptions = options.filter((option) => value.includes(option.value))
    const hasMultipleValues = selectedOptions.length > 1

    const dropdownRef = useRef<DropdownRef>(null)

    useEffect(() => {
      if (isEditing && dropdownRef.current) {
        !dropdownRef.current.isOpen && dropdownRef.current?.open()
      }
    }, [isEditing, dropdownRef.current])

    if (isEditing) {
      const handleChange = (value: string[]) => {
        if (type?.includes('list')) {
          onChange(value)
        } else {
          // take first value as the type is not list]
          onChange(value[0])
        }
      }

      return (
        <StyledDropdown
          options={options}
          value={valueAsStrings}
          ref={dropdownRef}
          valueTemplate={(_value, selected, isOpen) => (
            <EnumCellValue
              selectedOptions={options.filter((option) =>
                selected.includes(option.value.toString()),
              )}
              hasMultipleValues={selected.length > 1}
              isOpen={isOpen}
              className="enum-dropdown-value"
            />
          )}
          itemTemplate={(option, _isActive, isSelected) => (
            <EnumCellValue
              selectedOptions={[option]}
              hasMultipleValues={false}
              isOpen={false}
              isItem
              isSelected={isSelected}
              className="enum-dropdown-item"
            />
          )}
          widthExpand
          multiSelect={type?.includes('list')}
          onChange={handleChange}
        />
      )
    }

    return (
      <EnumCellValue
        selectedOptions={selectedOptions}
        hasMultipleValues={hasMultipleValues}
        className="enum-value"
      />
    )
  },
)

interface EnumTemplateProps extends React.HTMLAttributes<HTMLSpanElement> {
  selectedOptions: AttributeEnumItem[]
  hasMultipleValues: boolean
  isOpen?: boolean
  isItem?: boolean
  isSelected?: boolean
}

const EnumCellValue = ({
  selectedOptions,
  hasMultipleValues,
  isOpen,
  isItem,
  isSelected,
  className,
  ...props
}: EnumTemplateProps) => {
  return (
    <StyledWidget className={clsx(className, { selected: isSelected, item: isItem })} {...props}>
      {selectedOptions.map(
        (option) =>
          option.icon &&
          (checkForImgSrc(option.icon) ? (
            <StyledImg
              key={option.value.toString()}
              src={option.icon}
              className={clsx({ avatar: checkAvatarImg(option.icon) })}
            />
          ) : (
            <Icon
              key={option.value.toString()}
              icon={option.icon}
              style={{ color: option.color }}
            />
          )),
      )}
      {!hasMultipleValues && selectedOptions.length === 1 && (
        <StyledValue style={{ color: selectedOptions[0].color }}>
          {selectedOptions[0].label}
        </StyledValue>
      )}
      {!isItem && (
        <StyledExpandIcon icon="expand_more" style={{ rotate: isOpen ? '180deg' : '0' }} />
      )}
    </StyledWidget>
  )
}
