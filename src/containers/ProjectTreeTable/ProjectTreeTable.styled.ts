import styled from 'styled-components'

// Create shadow mixins to make combinations work properly
const topShadow = `inset 0 1px 0 0 var(--md-sys-color-primary)`
const rightShadow = `inset -1px 0 0 0 var(--md-sys-color-primary)`
const bottomShadow = `inset 0 -1px 0 0 var(--md-sys-color-primary)`
const leftShadow = `inset 1px 0 0 0 var(--md-sys-color-primary)`
const defaultShadow = `inset 1px -1px 0 0 var(--md-sys-color-surface-container)`

export const TR = styled.tr`
  display: table-row;
  position: absolute;
  width: 100%;

  &.selected {
    td {
      background-color: var(--md-sys-color-surface-container-high);
    }
  }
`

const cellMinWidth = 50

export const TableCellContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 100%;
  width: 100%;
  padding: 0px 8px;
  border-radius: var(--border-radius-m);
  user-select: none;
  padding-right: 0;

  min-width: ${cellMinWidth}px;
  height: auto;
  &.bold {
    font-weight: 600;
  }
`

export const ResizedHandler = styled.div`
  position: absolute;
  right: -1px;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background-color: var(--md-sys-color-surface-container-high);

  opacity: 0;

  &.resizing {
    background-color: var(--md-sys-color-primary);
    opacity: 1;
  }
`

export const ColumnHeader = styled.div`
  background-color: var(--md-sys-color-surface-container-low);
`

export const HeaderCell = styled.div`
  position: relative;
  background-color: var(--md-sys-color-surface-container-lowest);
  box-shadow: inset 1px -1px 0 0 var(--md-sys-color-surface-container);
  display: flex;
  align-items: center;
  min-height: fit-content;
  min-width: ${cellMinWidth}px;
  &.large {
    min-width: 300px;
  }
  &:hover {
    .resize-handle {
      opacity: 1;
    }
  }

  /* show action button */
  &:hover {
    .action {
      display: flex;
    }
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

export const HeaderButtons = styled.div`
  display: flex;
  gap: var(--base-gap-small);

  position: absolute;
  z-index: 10;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
`

export const TableCell = styled.td`
  position: relative;
  box-shadow: ${defaultShadow};
  min-width: ${cellMinWidth}px;
  background-color: var(--md-sys-color-surface-container-low);

  &.selected {
    background-color: var(--md-sys-color-secondary-container);
    position: relative;
    z-index: 1;
  }

  /* Shadow combinations - single side */
  &.shadow-top:not(.shadow-right):not(.shadow-bottom):not(.shadow-left) {
    box-shadow: ${topShadow}, ${defaultShadow};
  }

  &.shadow-right:not(.shadow-top):not(.shadow-bottom):not(.shadow-left) {
    box-shadow: ${rightShadow}, ${defaultShadow};
  }

  &.shadow-bottom:not(.shadow-top):not(.shadow-right):not(.shadow-left) {
    box-shadow: ${bottomShadow}, ${defaultShadow};
  }

  &.shadow-left:not(.shadow-top):not(.shadow-right):not(.shadow-bottom) {
    box-shadow: ${leftShadow}, ${defaultShadow};
  }

  /* Two sides */
  &.shadow-top.shadow-right:not(.shadow-bottom):not(.shadow-left) {
    box-shadow: ${topShadow}, ${rightShadow}, ${defaultShadow};
  }

  &.shadow-top.shadow-bottom:not(.shadow-right):not(.shadow-left) {
    box-shadow: ${topShadow}, ${bottomShadow}, ${defaultShadow};
  }

  &.shadow-top.shadow-left:not(.shadow-right):not(.shadow-bottom) {
    box-shadow: ${topShadow}, ${leftShadow}, ${defaultShadow};
  }

  &.shadow-right.shadow-bottom:not(.shadow-top):not(.shadow-left) {
    box-shadow: ${rightShadow}, ${bottomShadow}, ${defaultShadow};
  }

  &.shadow-right.shadow-left:not(.shadow-top):not(.shadow-bottom) {
    box-shadow: ${rightShadow}, ${leftShadow}, ${defaultShadow};
  }

  &.shadow-bottom.shadow-left:not(.shadow-top):not(.shadow-right) {
    box-shadow: ${bottomShadow}, ${leftShadow}, ${defaultShadow};
  }

  /* Three sides */
  &.shadow-top.shadow-right.shadow-bottom:not(.shadow-left) {
    box-shadow: ${topShadow}, ${rightShadow}, ${bottomShadow}, ${defaultShadow};
  }

  &.shadow-top.shadow-right.shadow-left:not(.shadow-bottom) {
    box-shadow: ${topShadow}, ${rightShadow}, ${leftShadow}, ${defaultShadow};
  }

  &.shadow-top.shadow-bottom.shadow-left:not(.shadow-right) {
    box-shadow: ${topShadow}, ${bottomShadow}, ${leftShadow}, ${defaultShadow};
  }

  &.shadow-right.shadow-bottom.shadow-left:not(.shadow-top) {
    box-shadow: ${rightShadow}, ${bottomShadow}, ${leftShadow}, ${defaultShadow};
  }

  /* All four sides */
  &.shadow-top.shadow-right.shadow-bottom.shadow-left {
    box-shadow: ${topShadow}, ${rightShadow}, ${bottomShadow}, ${leftShadow}, ${defaultShadow};
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

export const TableHeader = styled.div`
  display: grid !important;
  position: sticky;
  top: 0;
  min-height: 34px;
  z-index: 10;
  background-color: var(--md-sys-color-surface-container-lowest);
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
