import styled from 'styled-components'
import { ValuePill } from '@shared/components/ValuePill'
import HeaderButton from '@containers/header/HeaderButton'
import { FOLDER_ROW_HEIGHT, getIndent } from './MobileOverviewHelpers'

const buttonReset = `
  border: 0;
  margin: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
`

const ellipsis = `
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

export const Page = styled.main`
  /* beats the global #root > main page layout */
  #root > & {
    flex-direction: column;
    gap: 0;
    padding: 0;
  }
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--md-sys-color-background);
  color: var(--md-sys-color-on-surface);
`

export const BackButton = styled.button`
  ${buttonReset}
  display: flex;
  align-items: center;
  align-self: flex-start;
  gap: 2px;
  max-width: 100%;
  min-height: 44px;
  padding: 0 8px 0 4px;
  color: var(--md-sys-color-primary);

  span:last-child {
    ${ellipsis}
  }
`

export const FilterBar = styled.div`
  display: flex;
  flex-shrink: 0;
  margin: 4px 8px 0;

  & > * {
    flex: 1;
    min-width: 0;
  }
`

export const List = styled.div`
  flex: 1;
  min-height: 0;
  margin: 4px 8px 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  border-radius: var(--border-radius-l) var(--border-radius-l) 0 0;
  background-color: var(--color-table-row);
`

export const FolderRow = styled.div<{ $depth: number; $isOpen: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  height: ${FOLDER_ROW_HEIGHT}px;
  border-bottom: 1px solid var(--color-table-border);
  background-color: var(--color-table-row-high);

  ${({ $isOpen, $depth }) =>
    $isOpen &&
    `
    position: sticky;
    top: ${$depth * FOLDER_ROW_HEIGHT}px;
    z-index: ${Math.max(1, 20 - $depth)};
    border-bottom-color: transparent;
  `}
`

// the open folder's header is sticky, so scrolling slides this body under it and leaves a compact row
export const FolderCardBody = styled.button<{ $indent: number }>`
  ${buttonReset}
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 0 8px 10px ${({ $indent }) => $indent}px;
  border-bottom: 1px solid var(--color-table-border);
  background-color: var(--color-table-row-high);

  &:active {
    background-color: var(--color-table-hover);
  }
`

export const FolderToggle = styled.button<{ $depth: number }>`
  ${buttonReset}
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 4px 0 ${({ $depth }) => getIndent($depth)}px;

  &:active {
    background-color: var(--color-table-hover);
  }

  .caret,
  .count {
    flex-shrink: 0;
    color: var(--md-sys-color-on-surface-variant);
  }

  .name {
    ${ellipsis}
    flex: 1;
    font-weight: 600;
  }

  .count {
    font-size: 12px;
    line-height: 16px;
  }
`

export const FolderDetailsButton = styled.button`
  ${buttonReset}
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 100%;
  color: var(--md-sys-color-on-surface-variant);

  &:active {
    background-color: var(--color-table-hover);
  }
`

export const TaskRow = styled.button<{ $indent: number }>`
  ${buttonReset}
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  min-height: 68px;
  padding: 8px 8px 8px ${({ $indent }) => $indent}px;
  border-bottom: 1px solid var(--color-table-border);
  content-visibility: auto;
  contain-intrinsic-size: auto 68px;

  &:active {
    background-color: var(--color-table-row-hover);
  }
`

export const ThumbnailBox = styled.span`
  display: block;
  width: 72px;
  flex-shrink: 0;
`

export const TaskText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`

export const TaskName = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;

  span:last-child {
    ${ellipsis}
    font-weight: 600;
  }
`

export const TaskMeta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 10px;
  min-width: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--md-sys-color-on-surface-variant);
`

export const TaskField = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;

  .label {
    flex-shrink: 0;
  }

  .value {
    ${ellipsis}
    max-width: 160px;
    color: var(--md-sys-color-on-surface);
  }

  .boolean {
    width: auto;
  }
`

// the status as the table shows it: a pill filled with the status colour
export const StatusPill = styled(ValuePill)`
  flex-shrink: 0;
  max-width: 40%;
  font-size: 12px;
`

export const Message = styled.div`
  padding: 16px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
`

export const DetailsOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 600;
  display: flex;
  flex-direction: column;
  background-color: var(--md-sys-color-background);
`

export const DetailsBar = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 4px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-background);
`

export const DetailsBody = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`

// the page's main action: the primary blue, like the desktop Create button
export const CreateHeaderButton = styled(HeaderButton)`
  &&& {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);

    &:hover {
      background-color: var(--md-sys-color-primary-hover);
    }

    &:active,
    &.active {
      background-color: var(--md-sys-color-primary-active);
    }

    .icon {
      color: var(--md-sys-color-on-primary);
    }
  }
`
