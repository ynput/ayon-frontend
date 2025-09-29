import { Button, Icon, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const Expander = styled(Button)`
  &.expander {
    background-color: unset;
    padding: 2px;

    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
    }
  }
  cursor: pointer;
`

const StyledEntityNameWidget = styled.div`
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

const StyledTextContent = styled.div<{ $isCompact: boolean }>`
  display: flex;
  flex-direction: ${props => props.$isCompact ? 'row' : 'column'};
  align-items: ${props => props.$isCompact ? 'center' : 'flex-start'};
  gap: ${props => props.$isCompact ? '0px' : '0px'};
  overflow: hidden;
  flex: 1;
  min-width: 0;

  .path {
    ${theme.bodyMedium}
    font-size: 14px;
    margin-bottom: ${props => props.$isCompact ? '0' : '-4px'};
    color: var(--md-sys-color-outline);
    ${props => props.$isCompact && 'margin-right: 4px;'}
    white-space: nowrap;
    overflow: hidden;
    ${props => props.$isCompact ? `
      text-overflow: unset;
      flex-shrink: 0 1 auto;
    ` : `
      text-overflow: ellipsis;
    `}
  }
  

  .label {
    ${theme.bodyMedium}
    font-size: 14px;
    ${props => props.$isCompact && 'margin-left: 4px;'}
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1 1 auto;            /* ✅ allow shrinking so ellipsis can appear */
    min-width: 0;              /* ✅ critical inside flex to enable ellipsis */
  }

  .divider {
    ${theme.bodyMedium}
    font-size: 14px;
    color: var(--md-sys-color-outline);
    margin: 0 4px;
    flex-shrink: 0;
  }
  }
`

type EntityNameWidgetProps = {
  id: string
  label: string
  name: string
  path?: string | null
  showHierarchy?: boolean
  icon?: string | null
  type: string
  isExpanded: boolean
  toggleExpandAll: (id: string) => void
  toggleExpanded: () => void
  rowHeight?: number
}

export const EntityNameWidget = ({
  id,
  label,
  name,
  path,
  showHierarchy,
  icon,
  type,
  isExpanded,
  toggleExpandAll,
  toggleExpanded,
  rowHeight = 40,
}: EntityNameWidgetProps) => {
  // Determine layout based on row height
  // < 50px = single line (compact), >= 50px = stacked
  const isCompact = rowHeight < 50

  // For compact mode, show single line with "path / label"
  // For stacked mode, show path above label
  const contentHeight = isCompact ? 24 : (path ? 32 : 24)

  return (
    <StyledEntityNameWidget>
      {showHierarchy ? (
        type === 'folder' ? (
          <Expander
            onClick={(e) => {
              e.stopPropagation()
              if (e.altKey) {
                // expand/collapse all children
                toggleExpandAll(id)
              } else {
                // use built-in toggleExpanded function
                toggleExpanded()
              }
            }}
            className="expander"
            icon={isExpanded ? 'expand_more' : 'chevron_right'}
          />
        ) : (
          <div style={{ display: 'inline-block', minWidth: 24 }} />
        )
      ) : null}
      <StyledContentWrapper style={{ height: contentHeight }}>
        <StyledContentAbsolute>
          <StyledContent>
            {icon && <Icon icon={icon} />}
            <StyledTextContent $isCompact={isCompact}>
              {path && <span className="path">{path}</span>}
              {isCompact && path && <span className="divider">/</span>}
              <span className="label">{label || name}</span>
            </StyledTextContent>
          </StyledContent>
        </StyledContentAbsolute>
      </StyledContentWrapper>
    </StyledEntityNameWidget>
  )
}
