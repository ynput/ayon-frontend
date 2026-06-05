import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

export const TR = styled.tr`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 36px;

  border-radius: var(--border-radius-m);
  overflow: hidden;

  /* ROW COLOR */
  .inner-td {
    background-color: var(--md-sys-color-surface-container);
    border-top: 2px solid var(--md-sys-color-surface-container);
    border-bottom: 2px solid var(--md-sys-color-surface-container);
  }

  td:first-child .inner-td {
    border-left: 2px solid var(--md-sys-color-surface-container);
  }

  td:last-child .inner-td {
    border-right: 2px solid var(--md-sys-color-surface-container);
  }

  &:hover {
    .inner-td {
      background-color: var(--md-sys-color-surface-container-hover);
      border-top-color: var(--md-sys-color-surface-container-hover);
      border-bottom-color: var(--md-sys-color-surface-container-hover);
    }

    td:first-child .inner-td {
      border-left-color: var(--md-sys-color-surface-container-hover);
    }

    td:last-child .inner-td {
      border-right-color: var(--md-sys-color-surface-container-hover);
    }
  }

  &.selected {
    .inner-td {
      background-color: var(--md-sys-color-primary-container);
      border-top: 2px solid var(--md-sys-color-primary);
      border-bottom: 2px solid var(--md-sys-color-primary);
    }
  }

  &.selected td:first-child .inner-td {
    border-left: 2px solid var(--md-sys-color-primary);
  }

  &.selected td:last-child .inner-td {
    border-right: 2px solid var(--md-sys-color-primary);
  }

  &.inactive {
    color: var(--md-sys-color-outline);
  }

  &.dragging {
    opacity: 0;
  }

  &.group-row {
    background-color: transparent;

    &:hover,
    &.expanded {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }

  &.placeholder-row {
    background-color: transparent;

    .inner-td {
      background-color: transparent;
      border-color: transparent;
    }

    &:hover {
      .inner-td {
        background-color: transparent;
        border-color: transparent;
      }
    }
  }
`

export const TD = styled.td`
  position: relative;
  height: 100%;

  background-color: transparent;
  user-select: none;

  &:first-child .inner-td {
    border-top-left-radius: var(--border-radius-m);
    border-bottom-left-radius: var(--border-radius-m);
  }

  &:last-child .inner-td {
    border-top-right-radius: var(--border-radius-m);
    border-bottom-right-radius: var(--border-radius-m);
  }

  &:focus-visible {
    outline: none;
  }
`

export const TDInner = styled.div`
  position: absolute;
  inset: 0;

  padding: 0 var(--padding-m);
  display: flex;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
  box-sizing: border-box;
  min-width: 0;
`

export const PlaceholderRowContent = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--md-sys-color-on-surface-variant);
  font-style: italic;
  pointer-events: none;
`

// convenience cell wrapper div use of cell container prop
export const ListTableCellWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: var(--padding-s);
  overflow: hidden;
  min-width: 0;

  & > * {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    min-width: 0;
  }
`

export const EditableCellValue = styled.div<{ $isEditing?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 28px;
  padding: 0 var(--padding-s);
  border-radius: var(--border-radius-m);
  transition: background-color 120ms ease, outline-color 120ms ease;
  overflow: hidden;
  min-width: 0;

  & > * {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    min-width: 0;
  }

  &:hover:not(.editing):not(.boolean) {
    background-color: var(--md-sys-color-surface-container-high);
  }

  &.editing:not(.boolean) {
    background-color: var(--md-sys-color-surface-container);
  }
`

export const TableWrapper = styled.div`
  overflow: hidden;
  position: absolute;
  inset: 0;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
`

export const TableContainer = styled.div`
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  overflow: auto;
  padding: 8px;
  padding-top: 0;
  outline: none;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);

  &[data-hover-frozen] .th-actions {
    visibility: hidden !important;
    pointer-events: none !important;
  }

  table {
    height: fit-content;
    width: 100%;
    display: grid;
  }

  tbody {
    position: relative;
    display: grid;
  }
`

export const Table = styled.table`
  width: 100%;
  text-align: left;
  font-size: var(--font-size-s);
  color: var(--md-sys-color-on-surface);
  display: grid;
`

export const THead = styled.thead`
  display: grid !important;
  position: sticky;
  top: 0;
  min-height: 34px;
  z-index: 10;
  background-color: var(--md-sys-color-surface-container-low);
`

export const HeaderTR = styled.tr`
  display: flex;
  width: 100%;
`

export const TH = styled.th`
  position: relative;
  background-color: transparent;
  display: flex;
  align-items: center;
  padding: 0 var(--padding-m);
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-height: fit-content;
`

export const TBody = styled.tbody`
  display: grid;
  width: 100%;
  position: relative;
`

export const LoaderTR = styled.tr`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: var(--padding-m);
  color: var(--md-sys-color-outline);
`

export const OverlayTR = styled.tr`
  display: flex;
  width: 100%;
  background-color: var(--md-sys-color-surface-container-high);
  outline: 2px solid var(--md-sys-color-primary);
  border-radius: var(--border-radius-m);
  cursor: grabbing;
  z-index: 50;

  &.inactive {
    color: var(--md-sys-color-on-surface-variant);
  }
`

export const SortableTHStyled = styled.th`
  position: relative;
  background-color: transparent;
  display: flex;
  align-items: center;
  padding: 0 var(--padding-m);
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
  overflow: visible;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-height: fit-content;
  cursor: default;
  user-select: none;
  transition: opacity 100ms ease, transform 200ms ease;

  &.grab {
    cursor: grab;
  }

  &.dragging {
    opacity: 0;
  }

  /* Hide action buttons by default — they are absolutely positioned so no layout space */
  .th-actions {
    visibility: hidden;
    pointer-events: none;
  }

  &:hover .th-actions,
  &.menu-open .th-actions {
    visibility: visible;
    pointer-events: auto;
    background-color: var(--md-sys-color-surface-container-low);
  }

  &:hover .resize-handle {
    opacity: 1;
  }

  &.sorted .th-actions {
    visibility: visible;
    pointer-events: auto;
  }

  &.resizing .th-actions {
    visibility: hidden;
    pointer-events: none;
  }

  &.resizing .resize-handle:not(.resizing) {
    opacity: 0;
  }
`

export const GroupRowContent = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--padding-m);
  width: 100%;
  height: 100%;
  font-size: var(--font-size-s);
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  user-select: none;
`

export const Expander = styled(Button)`
  &.expander {
    background-color: unset;
    padding: 2px;

    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
    }
  }
  cursor: pointer;
`

export const GroupTD = styled.td`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  padding: 0;
`

export const GroupCount = styled.span`
  font-weight: 400;
  color: var(--md-sys-color-outline);
  opacity: 0.7;
`

export const GroupColorDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
`

export const DraggedColumnHeader = styled.th`
  position: relative;
  cursor: grabbing;
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  display: flex;
  align-items: center;
  padding: 0 var(--padding-m);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 50;
  height: 30px;
`

export const THContent = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  user-select: none;
`

export const THActions = styled.div.attrs({ className: 'th-actions' })`
  position: absolute;
  right: var(--padding-m);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  z-index: 1;
`

export const ResizeHandle = styled.div`
  position: absolute;
  right: -3px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 2;
  opacity: 0;
  background-color: var(--md-sys-color-surface-container-high);

  &.resizing {
    background-color: var(--md-sys-color-primary);
    opacity: 1;
  }
`
