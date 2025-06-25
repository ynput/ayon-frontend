import { AttributeEnumItem } from '@shared/api'
import { Icon, IconProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import styled from 'styled-components'

const StyledWidget = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--border-radius-m);

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
  flex: 1;
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  padding: 0px 2px;
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
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  text-overflow: ellipsis;
  text-align: left;
  border-radius: var(--border-radius-m);
  padding: 0px 2px;

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

const StyledExpandButton = styled.div`
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-m);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &.open {
    background-color: unset;
  }
`

const StyledExpandIcon = styled(Icon)`
  transition: rotate 0.2s;
`

export interface EnumTemplateProps extends React.HTMLAttributes<HTMLSpanElement> {
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

export const EnumCellValue = ({
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
        <StyledExpandButton className={clsx('expand', { open: isOpen }, expandClassName)}>
          <StyledExpandIcon
            icon="expand_more"
            style={{ rotate: isOpen ? '180deg' : '0', ...expandStyle }}
            aria-label="Expand options"
            {...expandRest}
          />
        </StyledExpandButton>
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

// Helper functions to check if the icon is a valid image source
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
