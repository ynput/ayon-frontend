import type { EnumItem } from '@shared/api'
import { getReadableColor, getTagColors, Icon, IconProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import styled from 'styled-components'
import { wrapMode } from './wrapMode'
import { getPillColors, type PillStyle } from './pillColors'
// Inline the edit trigger class to avoid runtime import and circular dependency with CellWidget
const EDIT_TRIGGER_CLASS = 'edit-trigger'

const StyledValue = styled.span`
  text-align: left;
  border-radius: var(--border-radius-m);
  padding: 0px 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  &.placeholder {
    color: var(--md-sys-color-outline);
  }
`

const StyledWidget = styled.div`
  display: flex;
  gap: 1px;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: visible;
  border-radius: var(--border-radius-m);
  padding: 0 1px;

  &.item {
    padding: 4px 2px;
    border-radius: 0;
    overflow: hidden;

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

  /* wrapped rows sit on a fixed row lattice, so the height clip can only land between rows */
  ${wrapMode`
    &.multi-select:not(.item) {
      .values {
        --wrap-row-height: 24px;
        --wrap-row-gap: var(--base-gap-small);
        flex-wrap: wrap;
        align-items: flex-start;
        align-content: flex-start;
        row-gap: var(--wrap-row-gap);
        max-height: 100%;
        /* var() inside an unsupported round() computes to none, not to the fallback — gate it */
        @supports (max-height: round(down, 100px, 24px)) {
          max-height: calc(
            round(
                down,
                100cqh + var(--wrap-row-gap),
                calc(var(--wrap-row-height) + var(--wrap-row-gap))
              ) - var(--wrap-row-gap)
          );
        }
      }

      .values > * {
        min-height: var(--wrap-row-height);
      }

      ${StyledValue} {
        white-space: normal;
        word-break: break-word;
        line-height: var(--wrap-row-height);
      }

      .has-img ${StyledValue} {
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  `}
`

const StyledValuesContainer = styled.div`
  flex: 1;
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  align-content: flex-start;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  padding: 0px 2px;
  flex-wrap: nowrap;
`

const StyledValueWrapper = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;

  max-width: 100%;
  min-width: 20px;

  &.pill {
    gap: 4px;
    padding: 1px 6px 1px 4px;
    border-radius: var(--border-radius-m);
  }
`

const StyledImg = styled.img`
  width: 20px;
  height: 20px;
  object-fit: cover;
  flex-shrink: 0;

  &.avatar {
    border-radius: 50%;
  }
`

const StyledExpandButton = styled.div`
  border-radius: var(--border-radius-m);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &.open {
    background-color: transparent;
  }
`

const StyledExpandIcon = styled(Icon)`
  transition: rotate 0.2s;
  padding: 2px;
`

export interface EnumTemplateProps extends React.HTMLAttributes<HTMLSpanElement> {
  selectedOptions: EnumItem[]
  placeholder?: string
  hasMultipleValues?: boolean
  isMultiSelect?: boolean
  isOpen?: boolean
  isItem?: boolean
  isSelected?: boolean
  isReadOnly?: boolean
  iconOnlyColor?: boolean // When true, only the icon gets colored, not the text label
  // a single value with a colour shows as a pill (see getPillColors); lists keep their own chips
  pill?: PillStyle
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
  iconOnlyColor = false,
  pill: pillStyle,
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
    <StyledWidget
      className={clsx(className, {
        selected: isSelected,
        item: isItem,
        'multi-select': isMultiSelect,
      })}
      {...props}
    >
      <StyledValuesContainer className="values">
        {selectedOptions.map((option, i) => {
          const pill =
            pillStyle && option.color && !isMultiSelect && !iconOnlyColor
              ? getPillColors({ ...option, color: option.color }, pillStyle)
              : undefined
          return (
            <StyledValueWrapper
              key={option.value.toString() + i}
              className={clsx({ 'has-img': checkForImgSrc(option.icon), pill })}
              style={pill}
            >
              {option.icon && checkForImgSrc(option.icon) ? (
                <StyledImg
                  src={option.icon}
                  className={clsx({ avatar: checkAvatarImg(option.icon) }, imgClassName)}
                  style={imgStyle}
                  data-tooltip={option.label}
                  {...imgRest}
                />
              ) : option.icon ? (
                <Icon
                  icon={option.icon}
                  style={{
                    color: pill ? pill.color : getReadableColor(option),
                    ...iconStyle,
                  }}
                  className={iconClassName}
                  {...iconRest}
                />
              ) : null}

              {(showLabels || !option.icon) && (
                <StyledValue
                  style={{
                    ...(!pill && getValueColors(option, !!backgroundColor, iconOnlyColor)),
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
          )
        })}
      </StyledValuesContainer>
      {!isItem && !isReadOnly && (
        <StyledExpandButton
          className={clsx('expand', EDIT_TRIGGER_CLASS, { open: isOpen }, expandClassName)}
        >
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

// a value shown as a chip takes the tag colours, otherwise its colour is the text colour
const getValueColors = (
  option: EnumItem,
  isChip: boolean,
  iconOnlyColor: boolean,
): React.CSSProperties => {
  if (isChip && option.color) {
    const colors = getTagColors(option)
    return {
      color: colors.text,
      backgroundColor: colors.background,
      boxShadow: `inset 0 0 0 1px ${colors.border}`,
    }
  }
  if (isChip) return { backgroundColor: 'var(--md-sys-color-surface-container)' }
  return {
    color: iconOnlyColor && option.icon ? undefined : getReadableColor(option),
    backgroundColor: 'transparent',
  }
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
