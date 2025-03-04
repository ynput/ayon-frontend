import { TableContainer as BaseTableContainer } from '@containers/Slicer/SlicerTable.styled'
import styled from 'styled-components'
import SimpleEditableCell from './Cells/SimpleEditableCell'

export const TableCellContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 100%;
  padding: 0px 4px;
  border-radius: var(--border-radius-m);
  user-select: none;
  padding-right: 0;

  min-width: 300px;
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

export const EditableCellContent = styled(SimpleEditableCell)`
  color: red;
  &.bold {
    font-weight: 600;
  }
`

export const HeaderCell = styled.div`
  position: relative;
  box-shadow: inset 1px -1px 0 0 var(--md-sys-color-surface-container-highest);
  display: flex;
  align-items: center;
  min-height: fit-content;
  min-width: 160px;
  &.large {
    min-width: 300px;
  }
  &:hover {
    .resize-handle {
      opacity: 1;
    }
  }
`

// Create shadow mixins to make combinations work properly
const topShadow = `inset 0 1px 0 0 var(--md-sys-color-primary)`
const rightShadow = `inset -1px 0 0 0 var(--md-sys-color-primary)`
const bottomShadow = `inset 0 -1px 0 0 var(--md-sys-color-primary)`
const leftShadow = `inset 1px 0 0 0 var(--md-sys-color-primary)`
const defaultShadow = `inset 1px -1px 0 0 var(--md-sys-color-surface-container-highest)`

export const TableCell = styled.td`
  position: relative;
  box-shadow: ${defaultShadow};
  min-width: 160px;

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
`

export const TableHeader = styled.div`
  display: grid !important;
  position: sticky;
  top: 0;
  min-height: 34px;
  z-index: 10;
  background-color: var(--md-sys-color-surface-container-lowest);
`

export const TableContainer = styled(BaseTableContainer)`
  padding-top: 0;
`

export const TableContainerWrapper = styled.div`
  padding: 0 4px 4px 4px;
`
