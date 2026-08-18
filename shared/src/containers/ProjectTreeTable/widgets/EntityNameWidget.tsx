import { Button, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { isEntityRestricted } from '../utils/restrictedEntity'
import { getDisplayValue, type DisplayConfig, getColumnDisplayConfig } from '../types/columnConfig'
import { EntityIcon } from '@shared/components/EntityIcon/EntityIcon'
import { WRAP_MIN_ROW_HEIGHT } from '../constants'

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
  height: 32px;
  overflow: hidden;
  position: relative;

  &.stacked {
    height: 100%;
  }
`

const StyledContentAbsolute = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
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

  &.stacked {
    height: auto;
    max-height: 100%;
  }

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

  &.stacked .label {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    white-space: normal;
    word-break: break-word;
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
  isExpandable?: boolean
  entityType: string
  subType?: string | null
  isExpanded: boolean
  toggleExpandAll: (id: string) => void
  toggleExpanded: () => void
  rowHeight?: number
  columnDisplayConfig?: DisplayConfig
}

export const EntityNameWidget = ({
  id,
  label,
  name,
  path,
  isExpandable,
  entityType,
  subType,
  isExpanded,
  toggleExpandAll,
  toggleExpanded,
  rowHeight = 40,
  columnDisplayConfig,
}: EntityNameWidgetProps) => {
  // Check if this is a restricted access entity
  const isRestricted = isEntityRestricted(entityType)

  // Determine layout based on row height
  // below the wrap threshold = single line (compact), above = stacked
  const isCompact = rowHeight < WRAP_MIN_ROW_HEIGHT
  const layout = isCompact ? 'compact' : 'stacked'

  // Determine if path should be shown based on display configuration
  // Check layout-specific setting first, then general setting
  const showPathCompact = getDisplayValue(columnDisplayConfig, 'path', 'compact') ?? true
  const showPathFull = getDisplayValue(columnDisplayConfig, 'path', 'full') ?? true
  const shouldShowPath = isCompact ? showPathCompact : showPathFull

  return (
    <StyledEntityNameWidget className={layout}>
      {isExpandable ? (
        <Expander
          onClick={(e) => {
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
      ) : null}
      <StyledContentWrapper className={layout}>
        <StyledContentAbsolute>
          <StyledContent className={layout}>
            <EntityIcon entity={{ entityType, subType: subType || undefined }} />
            <StyledTextContent className={layout}>
              {shouldShowPath && !isRestricted && (
                <span className="path">
                  {path}
                  {isCompact && path ? '/' : ''}
                </span>
              )}
              <span className="label">{label || name}</span>
            </StyledTextContent>
          </StyledContent>
        </StyledContentAbsolute>
      </StyledContentWrapper>
    </StyledEntityNameWidget>
  )
}
