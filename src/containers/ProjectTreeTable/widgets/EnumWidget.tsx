import { AttributeData, AttributeEnumItem } from '@api/rest/attributes'
import { Dropdown, DropdownRef, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { WidgetBaseProps } from './CellWidget'

const StyledWidget = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
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

const StyledValuesContainer = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  overflow: hidden;
  border-radius: var(--border-radius-m);
`

const StyledValueWrapper = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;

  overflow: hidden;
  max-width: 100%;
  min-width: 20px;
`

const StyledValue = styled.span`
  /* push expand icon to the end */
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  text-overflow: ellipsis;
  text-align: left;
  border-radius: var(--border-radius-m);
  padding: 0px 2px;
  text-align: center;
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

interface EnumWidgetProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'>,
    WidgetBaseProps {
  value: (string | number | boolean)[]
  options: AttributeEnumItem[]
  type?: AttributeData['type']
  onOpen: () => void
}

const checkForImgSrc = (icon: string | undefined = ''): boolean => {
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
  ({ value, isEditing, options, type, onOpen, onChange }, _ref) => {
    // convert value to string array
    const valueAsStrings = value.map((v) => v?.toString())
    const selectedOptions = options.filter((option) => value.includes(option.value))
    const hasMultipleValues = selectedOptions.length > 1

    const dropdownRef = useRef<DropdownRef>(null)

    const handleClosedClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      // if we click on the chevron icon, then we open the dropdown spright away (put it into editing mode)
      if (e.target instanceof HTMLElement && e.target.closest('.expand')) {
        onOpen()
        // stop the event from propagating to the parent element because a single click on the cell would close the dropdown
        e.stopPropagation()
      }
    }

    useEffect(() => {
      if (isEditing && dropdownRef.current) {
        !dropdownRef.current.isOpen && dropdownRef.current?.open()
      }
    }, [isEditing, dropdownRef.current])
    const isMultiSelect = !!type?.includes('list')
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
              isMultiSelect={isMultiSelect}
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
          multiSelect={isMultiSelect}
          onChange={handleChange}
        />
      )
    }

    return (
      <EnumCellValue
        selectedOptions={selectedOptions}
        hasMultipleValues={hasMultipleValues}
        className="enum-value"
        onClick={handleClosedClick}
        isMultiSelect={isMultiSelect}
      />
    )
  },
)

interface EnumTemplateProps extends React.HTMLAttributes<HTMLSpanElement> {
  selectedOptions: AttributeEnumItem[]
  hasMultipleValues: boolean
  isMultiSelect?: boolean
  isOpen?: boolean
  isItem?: boolean
  isSelected?: boolean
}

const EnumCellValue = ({
  selectedOptions,
  hasMultipleValues,
  isMultiSelect,
  isOpen,
  isItem,
  isSelected,
  className,
  ...props
}: EnumTemplateProps) => {
  // Check if all options have icons
  const allOptionsHaveIcon = selectedOptions.every((option) => option.icon)

  // Determine if we should show labels based on the requirements
  const showLabels = !hasMultipleValues || !allOptionsHaveIcon
  // Show the colors be backgrounds instead of the text
  const backgroundColor = !allOptionsHaveIcon && isMultiSelect && !isItem

  return (
    <StyledWidget className={clsx(className, { selected: isSelected, item: isItem })} {...props}>
      <StyledValuesContainer>
        {selectedOptions.map((option) => (
          <StyledValueWrapper key={option.value.toString()}>
            {option.icon && checkForImgSrc(option.icon) ? (
              <StyledImg
                src={option.icon}
                className={clsx({ avatar: checkAvatarImg(option.icon) })}
              />
            ) : option.icon ? (
              <Icon icon={option.icon} style={{ color: option.color }} />
            ) : null}

            {(showLabels || !option.icon) && (
              <StyledValue
                style={{
                  color: backgroundColor ? 'inherit' : option.color,
                  backgroundColor: backgroundColor
                    ? option.color || 'var(--md-sys-color-surface-container)'
                    : 'transparent',
                }}
              >
                {option.label}
              </StyledValue>
            )}
          </StyledValueWrapper>
        ))}
      </StyledValuesContainer>
      {!isItem && (
        <StyledExpandIcon
          className="expand"
          icon="expand_more"
          style={{ rotate: isOpen ? '180deg' : '0' }}
        />
      )}
    </StyledWidget>
  )
}
