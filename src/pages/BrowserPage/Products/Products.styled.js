import styled from 'styled-components'
import { TablePanel } from '@ynput/ayon-react-components'
import CategorySelect from '@components/CategorySelect/CategorySelect'
import ColumnsSelect from '@components/ColumnsSelect/ColumnsSelect'

export const TaskFilterDropdown = styled(CategorySelect)`
  min-width: 160px;
  max-width: 160px;
`

export const ColumnsFilterSelect = styled(ColumnsSelect)`
  min-width: 170px;
  max-width: 170px;
`

// version statuses as filled pills, the same as the status cells of the project tables
export const ProductsTablePanel = styled(TablePanel)`
  /* the empty state replaces the table, its header row would float above the message */
  &.empty .p-treetable {
    visibility: hidden;
  }

  td.versionStatus .status-field.value {
    width: fit-content;
    max-width: 100%;
    /* StatusSelect sets its row height inline */
    height: 22px !important;
    min-height: 22px;
    padding: 0 6px 0 4px;

    .status-text {
      margin-left: 4px;
    }
  }
`
