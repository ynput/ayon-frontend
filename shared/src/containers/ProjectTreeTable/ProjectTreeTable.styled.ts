import styled from 'styled-components'

// Create shadow mixins to make combinations work properly
const topShadow = `inset 0 1px 0 0 var(--md-sys-color-primary)`
const rightShadow = `inset -1px 0 0 0 var(--md-sys-color-primary)`
const bottomShadow = `inset 0 -1px 0 0 var(--md-sys-color-primary)`
const leftShadow = `inset 1px 0 0 0 var(--md-sys-color-primary)`

const getDefaultShadow = (isLastPinned: boolean) => {
  const defaultShadow = `inset 1px -1px 0 0 var(--md-sys-color-surface-container)`
  const defaultShadowLastPinned = `inset -2px -1px 0 0 var(--md-sys-color-surface-container), inset 1px 0 0 0 var(--md-sys-color-surface-container)`
  return isLastPinned ? defaultShadowLastPinned : defaultShadow
}

// Use the known string literal for DRAG_HANDLE_COLUMN_ID to avoid import complexities here
const DRAG_HANDLE_CLASS = 'drag-handle'

export const TR = styled.tr`
  display: flex;
  position: absolute;
  width: 100%;

  &:hover {
    // When the row (TR) is hovered...

    // Target the button inside the drag handle cell to make it visible at 50% opacity.
    // This uses a more specific selector by including 'td' to ensure it correctly targets the cell.
    td.${DRAG_HANDLE_CLASS} button {
      opacity: 0.5;
      visibility: visible;
    }

    // When the row (TR) is hovered AND the button inside drag handle cell is also hovered...
    // Make the button 100% opacity. This selector is more specific and will override the above.
    td.${DRAG_HANDLE_CLASS} button:hover {
      opacity: 1;
    }

    /* row selection hover */
    td:not(.selected) {
      background-color: var(--color-table-row-hover);
    }
  }

  &.group-row {
    td {
      /* group headers do not have vertical grid lines */
      box-shadow: inset 0px -1px 0 0 var(--md-sys-color-surface-container);
    }
  }
`

export const TableCellContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 100%;
  width: 100%;
  padding: 0px 8px;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  user-select: none;
  padding-right: 0;

  &.bold {
    font-weight: 600;
  }

  &.loading {
    margin: 0px 5px;
    padding: 0 !important;
    width: calc(100% - 10px);
    height: calc(100% - 6px);
    margin-top: 3px;
  }

  &:focus-visible {
    outline: none;
  }

  .resizing & {
    cursor: col-resize !important;
  }
`

export const ResizedHandler = styled.div`
  position: absolute;
  right: -1px;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize !important;
  background-color: var(--md-sys-color-surface-container-high);

  opacity: 0;

  &.resizing {
    background-color: var(--md-sys-color-primary);
    opacity: 1;
    cursor: col-resize !important;
  }
`

export const ColumnHeader = styled.tr`
  background-color: var(--md-sys-color-surface-container-low);
`

export const HeaderCell = styled.th`
  position: relative;
  background-color: var(--md-sys-color-surface-container-lowest);
  box-shadow: inset 1px -1px 0 0 var(--md-sys-color-surface-container);
  display: flex;
  align-items: center;
  min-height: fit-content;

  &:hover {
    .resize-handle {
      opacity: 1;
    }
    
    .actions {
      display: flex !important;
    }
    
    .actions .header-menu {
      display: flex !important;
    }
  }

  /* Hide action buttons when resizing */
  &.resizing {
    .actions {
      display: none !important;
    }
    cursor: col-resize !important;

    * {
      cursor: col-resize !important;
    }
  }

  /* Styling for the last pinned left column */
  &.last-pinned-left {
    box-shadow: inset 1px -1px 0 0 var(--md-sys-color-surface-container),
      inset -2px 0 0 0 var(--md-sys-color-surface-container);
  }

  /* special styles for the left selection column */
  &.__row_selection__ {
    min-width: unset;
    width: 20px !important;

    .actions {
      display: none;
    }
  }
`

export const HeaderButtons = styled.div<{ $isOpen: boolean }>`
  display: none;

  ${({ $isOpen }) =>
    $isOpen &&
    `
    display: flex !important;
  `}

  gap: var(--base-gap-small);
  align-items: center;

  position: absolute;
  z-index: 10;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--md-sys-color-surface-container-lowest);
  padding-left: 4px;

  .resizing & {
    cursor: col-resize !important;
  }

  &:has(.sort-button.visible),
  &:has(.sort-button.selected) {
    display: flex !important;
  }

  .sort-button.visible {
    display: flex !important;
  }
  
  .sort-button.selected {
    display: flex !important;
  }

  .header-menu {
    display: none;
  }
  
  ${({ $isOpen }) =>
    $isOpen &&
    `
    .header-menu {
      display: flex !important;
    }
  `}
  
  .header-menu.open,
  .header-menu.active {
    display: flex !important;
  }

   .resizing & {
    .sort-button,
    .header-menu {
      display: none !important;
    }
  }
`

type TableCellProps = {
  $isLastPinned?: boolean
}

export const TableCell = styled.td<TableCellProps>`
  position: relative;
  box-shadow: ${getDefaultShadow(false)};
  background-color: var(--color-table-task);

  &.${DRAG_HANDLE_CLASS} {
    // Styles for the button inside the drag handle cell
    button {
      opacity: 0; // Default: hidden
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      // Base appearance styles (cursor, border, background, etc.)
      // are primarily handled by inline styles in RowDragHandleCellContent.tsx.
      // Add any necessary overrides or defaults here if needed.
      // For example, ensuring the button itself doesn't interfere with cell styling:
      background: transparent;
      border: none;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  }

  /* Lighter background for folders in hierarchy mode */
  &.folder-in-hierarchy {
    background-color: var(--color-table-folder);
  }

  &.selected-row {
    background-color: var(--color-table-selected-row);
  }

  /* show hover effect only if direct child div does NOT have .readonly and is not selected */
  &:not(:has(> div.readonly)) {
    cursor: pointer;
    &:hover {
      background-color: var(--color-table-hover);
    }

    &.selected {
      background-color: var(--color-table-selected);
    }
  }

  &.selected {
    background-color: var(--color-table-selected);
    position: relative;
    z-index: 1;
  }

  /* remove default focus style */
  &:focus-visible {
    outline: none;
  }

  /* Styling for the last pinned left column */
  /* extra border on the right */
  &.last-pinned-left {
    box-shadow: inset 1px -1px 0 0 var(--md-sys-color-surface-container),
      inset -2px 0 0 0 var(--md-sys-color-surface-container);
  }

  /* Shadow combinations - single side */
  &.shadow-top:not(.shadow-right):not(.shadow-bottom):not(.shadow-left) {
    box-shadow: ${topShadow}, ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-right:not(.shadow-top):not(.shadow-bottom):not(.shadow-left) {
    box-shadow: ${rightShadow}, ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-bottom:not(.shadow-top):not(.shadow-right):not(.shadow-left) {
    box-shadow: ${bottomShadow}, ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-left:not(.shadow-top):not(.shadow-right):not(.shadow-bottom) {
    box-shadow: ${leftShadow}, ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  /* Two sides */
  &.shadow-top.shadow-right:not(.shadow-bottom):not(.shadow-left) {
    box-shadow: ${topShadow}, ${rightShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-top.shadow-bottom:not(.shadow-right):not(.shadow-left) {
    box-shadow: ${topShadow}, ${bottomShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-top.shadow-left:not(.shadow-right):not(.shadow-bottom) {
    box-shadow: ${topShadow}, ${leftShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-right.shadow-bottom:not(.shadow-top):not(.shadow-left) {
    box-shadow: ${rightShadow}, ${bottomShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-right.shadow-left:not(.shadow-top):not(.shadow-bottom) {
    box-shadow: ${rightShadow}, ${leftShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-bottom.shadow-left:not(.shadow-top):not(.shadow-right) {
    box-shadow: ${bottomShadow}, ${leftShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  /* Three sides */
  &.shadow-top.shadow-right.shadow-bottom:not(.shadow-left) {
    box-shadow: ${topShadow}, ${rightShadow}, ${bottomShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-top.shadow-right.shadow-left:not(.shadow-bottom) {
    box-shadow: ${topShadow}, ${rightShadow}, ${leftShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-top.shadow-bottom.shadow-left:not(.shadow-right) {
    box-shadow: ${topShadow}, ${bottomShadow}, ${leftShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  &.shadow-right.shadow-bottom.shadow-left:not(.shadow-top) {
    box-shadow: ${rightShadow}, ${bottomShadow}, ${leftShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  /* All four sides */
  &.shadow-top.shadow-right.shadow-bottom.shadow-left {
    box-shadow: ${topShadow}, ${rightShadow}, ${bottomShadow}, ${leftShadow},
      ${({ $isLastPinned }) => getDefaultShadow($isLastPinned || false)};
  }

  /* Focus styling */
  &.focused {
    position: relative;
    z-index: 2;
  }

  /* Use pseudo-element for focused outline to avoid box-shadow conflicts */
  &.focused::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid var(--md-sys-color-primary);
    pointer-events: none;
  }

  /* read only fields are dimmed down for bg and border */
  &:has(> div.readonly) {
    &:not(.multiple-selected) {
      &.focused {
        background-color: var(--color-table-readonly-focused);
        &::after {
          border-color: var(--color-table-readonly-focused);
        }
      }
    }

    /* when focused is readonly and multiple-selected */
    &.multiple-selected {
      &.focused::after {
        display: none;
      }
    }
  }

  /* if there is no cell widget element (no children) then the cell should not be selectable at all */
  &:not(:has(> div)) {
    pointer-events: none;
    cursor: default;
  }

  &.editing {
    z-index: 10 !important;
    /* light border around the outside */
    &::before {
      content: '';
      position: absolute;
      inset: 2px;
      border: 2px solid var(--md-sys-color-surface-container-low);
    }
  }

  /* special styles for selection bar cells */
  &.__row_selection__ {
    width: 20px !important;
    min-width: unset;

    &.selected {
      background-color: var(--md-sys-color-primary-container) !important;
      box-shadow: none !important;
      /* reveal the check mark */
      [icon='check'] {
        display: block;
      }
    }
  }
`

export const TableHeader = styled.thead`
  display: grid !important;
  position: sticky;
  top: 0;
  min-height: 34px;
  z-index: 10;
  background-color: var(--md-sys-color-surface-container-lowest);

  .resizing & {
    cursor: col-resize !important;
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
  display: flex;

  height: 100%;
  width: 100%;
  overflow: auto;
  padding: 4px;
  padding-top: 0;

  &.isLoading {
    overflow: hidden;
  }

  /* Hide all header buttons when any column is being resized */
  &.resizing {
    .actions {
      display: none !important;
    }
  }

  table {
    height: fit-content;
    width: 100%;
    display: grid;
  }

  thead {
    display: none;
  }

  tbody {
    position: relative;
    display: grid;
  }

  td {
    height: 34px;
    padding: 1px 0px;
    width: 100%;
  }
`

export const LinkColumnHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  .icon {
    font-size: 18px;
    color: var(--md-sys-color-outline);
  }
`
