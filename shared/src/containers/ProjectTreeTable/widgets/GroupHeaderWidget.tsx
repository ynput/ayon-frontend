import { Button, Icon, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const Expander = styled(Button)`
  background-color: unset;
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
`

type GroupHeaderProps = {
  id: string
  label: string
  name: string
  icon?: string | null
  img?: string | null
  color?: string | null
  isExpanded: boolean
  toggleExpanded: () => void
}

export const GroupHeaderWidget = ({
  id,
  label,
  name,
  icon,
  img,
  color,
  isExpanded,
  toggleExpanded,
}: GroupHeaderProps) => {
  return (
    <StyledGroupHeader>
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
            {icon && <Icon icon={icon} style={{ color: color || undefined }} />}
            <StyledTextContent style={{ color: color || undefined }}>
              <span className="label">{label || name}</span>
            </StyledTextContent>
          </StyledContent>
        </StyledContentAbsolute>
      </StyledContentWrapper>
    </StyledGroupHeader>
  )
}
