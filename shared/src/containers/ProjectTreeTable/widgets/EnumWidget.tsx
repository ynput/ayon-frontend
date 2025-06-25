import { Dropdown, DropdownProps, DropdownRef, Icon, IconProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { WidgetBaseProps } from './CellWidget'
import { AttributeData, AttributeEnumItem } from '../types'

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

  &.placeholder {
    color: var(--md-sys-color-outline);
  }
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

    const handleClosedClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      // if we click on the chevron icon, then we open the dropdown spright away (put it into editing mode)
      if (e.target instanceof HTMLElement && e.target.closest('.expand') && onOpen && !isReadOnly) {
        onOpen()
        // stop the event from propagating to the parent element because a single click on the cell would close the dropdown
        e.stopPropagation()
      }
    }

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
        onClick={handleClosedClick}
        isMultiSelect={isMultiSelect}
        isReadOnly={isReadOnly}
        {...pt?.template}
        placeholder={dropdownProps.placeholder}
        className={clsx('enum-value', pt?.template?.className, dropdownProps.className)}
      />
    )
  },
)

interface EnumTemplateProps extends React.HTMLAttributes<HTMLSpanElement> {
  selectedOptions: AttributeEnumItem[]
  placeholder?: string
  hasMultipleValues: boolean
  isMultiSelect: boolean
  isOpen?: boolean
  isItem?: boolean
  isSelected?: boolean
  isReadOnly?: boolean
  pt?: {
    icon?: Partial<IconProps>
    img?: Partial<React.ImgHTMLAttributes<HTMLImageElement>>
    value?: Partial<React.ImgHTMLAttributes<HTMLSpanElement>>
    expand?: Partial<IconProps>
    close?: Partial<IconProps>
  }
}

const EnumCellValue = ({
  selectedOptions,
  placeholder,
  hasMultipleValues,
  isMultiSelect,
  isOpen,
  isItem,
  isSelected,
  isReadOnly,
  className,
  pt,
  ...props
}: EnumTemplateProps) => {
  // Destructure pt subprops and their relevant props at the top
  const {
    icon: ptIcon = {},
    img: ptImg = {},
    value: ptValue = {},
    expand: ptExpand = {},
    close: ptClose = {},
  } = pt || {}

  const { style: iconStyle, className: iconClassName, ...iconRest } = ptIcon
  const { style: imgStyle, className: imgClassName, ...imgRest } = ptImg
  const { style: valueStyle, className: valueClassName, ...valueRest } = ptValue
  const { style: expandStyle, className: expandClassName, ...expandRest } = ptExpand
  const { style: closeStyle, className: closeClassName, ...closeRest } = ptClose

  // Check if all options have icons
  const allOptionsHaveIcon = selectedOptions.every((option) => option.icon)

  // Determine if we should show labels based on the requirements
  const showLabels = !hasMultipleValues || !allOptionsHaveIcon
  // Show the colors be backgrounds instead of the text
  const backgroundColor = !allOptionsHaveIcon && isMultiSelect && !isItem

  const isPlaceholder = !selectedOptions.length && placeholder
  if (isPlaceholder) {
    selectedOptions = [
      {
        label: placeholder,
        value: '',
      },
    ]
  }

  return (
    <StyledWidget className={clsx(className, { selected: isSelected, item: isItem })} {...props}>
      <StyledValuesContainer>
        {selectedOptions.map((option, i) => (
          <StyledValueWrapper key={option.value.toString() + i}>
            {option.icon && checkForImgSrc(option.icon) ? (
              <StyledImg
                src={option.icon}
                className={clsx({ avatar: checkAvatarImg(option.icon) }, imgClassName)}
                style={imgStyle}
                {...imgRest}
              />
            ) : option.icon ? (
              <Icon
                icon={option.icon}
                style={{ color: option.color, ...iconStyle }}
                className={iconClassName}
                {...iconRest}
              />
            ) : null}

            {(showLabels || !option.icon) && (
              <StyledValue
                style={{
                  color: backgroundColor ? 'inherit' : option.color,
                  backgroundColor: backgroundColor
                    ? option.color || 'var(--md-sys-color-surface-container)'
                    : 'transparent',
                  ...valueStyle,
                }}
                className={clsx({ placeholder: isPlaceholder }, valueClassName)}
                aria-label={option.label}
                {...valueRest}
              >
                {option.label}
              </StyledValue>
            )}
          </StyledValueWrapper>
        ))}
      </StyledValuesContainer>
      {!isItem && !isReadOnly && (
        <StyledExpandIcon
          className={clsx('expand', { open: isOpen }, expandClassName)}
          icon="expand_more"
          style={{ rotate: isOpen ? '180deg' : '0', ...expandStyle }}
          aria-label="Expand options"
          {...expandRest}
        />
      )}
      {isItem && isSelected && isMultiSelect && (
        <Icon
          icon="close"
          style={{ marginLeft: 'auto', marginRight: 4, ...closeStyle }}
          aria-label="Deselect item"
          className={clsx('close', closeClassName)}
          {...closeRest}
        />
      )}
    </StyledWidget>
  )
}
