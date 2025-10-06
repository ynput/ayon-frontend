import { Button, Icon, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import clsx from 'clsx'

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

const StyledTextContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  flex: 1;
  min-width: 0;

  &.compact {
    flex-direction: row;
    align-items: center;
  }

  .path {
    ${theme.bodyMedium}
    font-size: 14px;
    margin-bottom: -4px;
    color: var(--md-sys-color-outline);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.compact .path {
    margin-bottom: 0;
    text-overflow: unset;
    flex-shrink: 0 1 auto;
  }

  .label {
    ${theme.bodyMedium}
    font-size: 14px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1 1 auto;
    min-width: 0;
  }

  .divider {
    ${theme.bodyMedium}
    font-size: 14px;
    color: var(--md-sys-color-outline);
    flex-shrink: 0;
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

  // Always keep content height at 24px in compact mode or hierarchy mode to prevent jumping
  // Only allow expansion to 32px in non-hierarchy mode when not compact and path exists
  const contentHeight = (isCompact || showHierarchy) ? 24 : (path ? 32 : 24)

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
            <StyledTextContent className={clsx({ compact: isCompact })}>
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
