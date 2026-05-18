import styled from 'styled-components'

export const TR = styled.tr`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 36px;
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  overflow: hidden;
  box-shadow: var(--md-sys-shadow-1);

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &:focus {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }

  &.dragging {
    opacity: 0;
  }
`

export const TD = styled.td`
  position: relative;
  height: 100%;
  padding: 0 var(--padding-m);
  display: flex;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
  background-color: transparent;
  user-select: none;

  &:focus-visible {
    outline: none;
  }
`

// convenience cell wrapper div use of cell container prop
export const ListTableCellWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: var(--padding-s);
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

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }

  &.editing {
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
  background-color: var(--md-sys-color-background);
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
`

export const SortableTHStyled = styled.th`
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
  cursor: default;
  transition: opacity 100ms ease, transform 200ms ease;

  &.grab {
    cursor: grab;
  }

  &.dragging {
    opacity: 0;
  }
`

export const DraggedColumnHeader = styled.th`
  position: relative;
  cursor: grabbing;
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  box-shadow: var(--md-sys-shadow-2);
  display: flex;
  align-items: center;
  padding: 0 var(--padding-m);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 50;
  height: 30px;
`
