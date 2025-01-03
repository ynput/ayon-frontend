import { Cell, TableContainer as BaseTableContainer } from '@containers/Slicer/SlicerTable.styled'
import styled from 'styled-components'
import SimpleEditableCell from './Cells/SimpleEditableCell'

export const TableCellContent = styled(Cell)`
  width: 150px;
  max-width: 150px;
  &.large {
    width: 300px;
    max-width: 300px;
  }
  &.bold {
    font-weight: 600;
  }
`

export const EditableCellContent = styled(SimpleEditableCell)`
  color: red;
  width: 150px;
  max-width: 150px;
  &.large {
    width: 300px;
    max-width: 300px;
  }
  &.bold {
    font-weight: 600;
  }
`

export const TableCell = styled.td`
  border: solid 1px;
  border-color: var(--md-sys-color-surface-container-highest);
  border-collapse: collapse;
  max-width: 150px;
  &.large {
    max-width: 300px;
  }
  &.selected {
    border-color: white;
    background-color: var(--md-sys-color-primary-container);
  }
`

export const TableHeader = styled.thead`
  display: grid !important;
  position: sticky;
  top: 0;
  min-height: 34px;
  z-index: 10;
  background-color: var(--md-sys-color-surface-container-lowest);
`

export const HeaderCell = styled(TableCell)`
  display: flex;
  align-items: center;
  padding: 0 4px;
`

export const TableContainer = styled(BaseTableContainer)`
  padding-top: 0;
`

export const TableContainerWrapper = styled.div`
  padding: 0 4px 4px 4px;
`

