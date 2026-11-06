import type { MouseEvent } from 'react'
import { Button, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { isEntityRestricted } from '../utils/restrictedEntity'
import { getDisplayValue, type DisplayConfig, getColumnDisplayConfig } from '../types/columnConfig'
import { EntityIcon } from '@shared/components/EntityIcon/EntityIcon'
import type { EntityData } from '../types/table'
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

  /* on one line the path (ending in its "/") gives way first, cut with an ellipsis the name
     follows directly; the name only shrinks once it alone is wider than the cell */
  &.compact .path {
    margin-bottom: 0;
    flex: 0 1000 auto;
    min-width: 0;
  }

  &.compact .label {
    flex-shrink: 0;
    max-width: 100%;
  }

  /* the name is what people scan for, the path only places it */
  .label {
    ${theme.bodyMedium}
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 0 1 auto;
    min-width: 0;
  }

  /* "product - v004": the product name is cut before the version, which tells rows apart */
  .label:has(.label-suffix) {
    display: flex;
  }

  .label-prefix {
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .label-suffix {
    flex-shrink: 0;
    white-space: pre;
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

// version rows are labelled "{product} - {version}"; product names have no spaces, so the first
// " - " is the separator
const splitVersionLabel = (entity: EntityData): [string, string] | null => {
  const label = entity.label || entity.name
  if (entity.entityType !== 'version' || !label) return null
  const index = label.indexOf(' - ')
  return index > 0 ? [label.slice(0, index), label.slice(index)] : null
}

type EntityNameWidgetProps = {
  id: string
  entity: EntityData
  path?: string | null
  isExpandable?: boolean
  isExpanded: boolean
  toggleExpandAll: (id: string) => void
  toggleExpanded: () => void
  rowHeight?: number
  columnDisplayConfig?: DisplayConfig
}

export const EntityNameWidget = ({
  id,
  entity,
  path,
  isExpandable,
  isExpanded,
  toggleExpandAll,
  toggleExpanded,
  rowHeight = 40,
  columnDisplayConfig,
}: EntityNameWidgetProps) => {
  // Check if this is a restricted access entity
  const isRestricted = isEntityRestricted(entity.entityType)

  // Determine layout based on row height
  // below the wrap threshold = single line (compact), above = stacked
  const isCompact = rowHeight < WRAP_MIN_ROW_HEIGHT
  const layout = isCompact ? 'compact' : 'stacked'

  // Determine if path should be shown based on display configuration
  // Check layout-specific setting first, then general setting
  const showPathCompact = getDisplayValue(columnDisplayConfig, 'path', 'compact') ?? true
  const showPathFull = getDisplayValue(columnDisplayConfig, 'path', 'full') ?? true
  const shouldShowPath = isCompact ? showPathCompact : showPathFull

  const versionLabel = isCompact ? splitVersionLabel(entity) : null

  // a cut path or name shows in full on hover (a version's path already ends in its product)
  const shownPath = shouldShowPath && !isRestricted ? path : undefined
  const fullName =
    shownPath && versionLabel
      ? shownPath + versionLabel[1]
      : [shownPath, entity.label || entity.name].filter(Boolean).join('/')
  const showFullNameIfCut = (event: MouseEvent<HTMLElement>) => {
    const el = event.currentTarget
    const isCut = Array.from(el.querySelectorAll<HTMLElement>('.path, .label, .label-prefix')).some(
      (part) => part.scrollWidth > part.clientWidth || part.scrollHeight > part.clientHeight,
    )
    if (isCut) el.dataset.tooltip = fullName
    else delete el.dataset.tooltip
  }

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
            <EntityIcon
              entity={{
                entityType: entity.entityType,
                subType: 'subType' in entity ? entity.subType : undefined,
              }}
              icon={entity.icon || undefined}
              color={entity.color ? entity : undefined}
            />
            <StyledTextContent className={layout} onMouseOver={showFullNameIfCut}>
              {shouldShowPath && !isRestricted && (
                <span className="path">
                  {path}
                  {isCompact && path && '/'}
                </span>
              )}
              <span className="label">
                {versionLabel ? (
                  <>
                    <span className="label-prefix">{versionLabel[0]}</span>
                    <span className="label-suffix">{versionLabel[1]}</span>
                  </>
                ) : (
                  entity.label || entity.name
                )}
              </span>
            </StyledTextContent>
          </StyledContent>
        </StyledContentAbsolute>
      </StyledContentWrapper>
    </StyledEntityNameWidget>
  )
}
