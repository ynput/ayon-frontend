import { Button, Icon, theme, getReadableColor } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import clsx from 'clsx'
import { getPillColors, type PillStyle } from '@shared/util/pillColors'

const Expander = styled(Button)`
  background-color: unset !important;
  padding: 2px !important;
  cursor: pointer;
`

const StyledGroupHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 100%;
  width: 100%;
  padding-right: 8px;
`

const StyledContentWrapper = styled.div`
  width: 100%;
  height: 24px;
  overflow: hidden;
  position: relative;
`

const StyledContentAbsolute = styled.div`
  position: absolute;
  inset: 0;
`

const StyledContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  padding: 2px 4px;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  overflow: hidden;
  width: fit-content;
  max-width: 100%;
  height: 100%;

  /* &:hover {
    &,
    .icon,
    .path {
      color: var(--md-sys-color-primary);
    }
  } */
`

const StyledTextContent = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .path {
    ${theme.labelSmall}
    margin-bottom: -4px;
    color: var(--md-sys-color-outline);
  }

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* group names read like the names in the rows */
  .label {
    font-weight: 600;
  }
`

// the group value, a pill when it has a colour
const StyledValue = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-width: 0;

  &.pill {
    padding: 1px 6px 1px 4px;
    border-radius: var(--border-radius-m);
  }
`

const StyledImg = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  object-fit: cover;
`

const Count = styled.span`
  color: var(--md-sys-color-outline);
  /* the count stays whole, the value before it is cut short */
  white-space: nowrap;
  flex-shrink: 0;
`

type GroupHeaderProps = {
  id: string
  label: string
  name: string
  icon?: string | null
  img?: string | null
  color?: string | null
  colorLight?: string | null
  count?: number
  percentage?: number
  isExpanded: boolean
  isEmpty?: boolean
  toggleExpanded: () => void
  pill?: PillStyle
}

export const GroupHeaderWidget = ({
  id,
  label,
  name,
  icon,
  img,
  count,
  percentage,
  color,
  colorLight,
  isExpanded,
  isEmpty,
  toggleExpanded,
  pill,
}: GroupHeaderProps) => {
  // a coloured group value shows as a pill, like the value in its cells
  const pillColors = pill && color ? getPillColors({ color, colorLight }, pill) : undefined
  const textColor = pillColors ? 'inherit' : getReadableColor({ color, colorLight })
  return (
    <StyledGroupHeader id={id}>
      <Expander
        onClick={(e) => {
          e.stopPropagation()
          toggleExpanded()
        }}
        className="expander"
        icon={isExpanded ? 'expand_more' : 'chevron_right'}
      />
      <StyledContentWrapper>
        <StyledContentAbsolute>
          <StyledContent>
            {img && <StyledImg src={img} alt={name} className="img" />}
            <StyledValue className={clsx({ pill: pillColors })} style={pillColors}>
              {icon && <Icon icon={icon} style={{ color: textColor }} />}
              <StyledTextContent style={{ color: textColor }}>
                <span className="label">{label || name}</span>
              </StyledTextContent>
            </StyledValue>
            {count !== undefined && count > 0 ? (
              <Count>
                {count}
                {percentage !== undefined && ` (${percentage}%)`}
              </Count>
            ) : isEmpty ? (
              <Count>(Empty)</Count>
            ) : null}
          </StyledContent>
        </StyledContentAbsolute>
      </StyledContentWrapper>
    </StyledGroupHeader>
  )
}
