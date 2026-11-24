import styled from 'styled-components'
import { TablePanel } from '@ynput/ayon-react-components'
import CategorySelect from '@components/CategorySelect/CategorySelect'
import ColumnsSelect from '@components/ColumnsSelect/ColumnsSelect'

// in a narrow pane the dropdowns give way before the search field does
export const TaskFilterDropdown = styled(CategorySelect)`
  flex: 0 1 160px;
  min-width: 104px;
  max-width: 160px;

  /* the placeholder reads like the filter input next to it (the dropdown dims it inline) */
  .placeholder {
    color: var(--md-sys-color-outline);
    opacity: 1 !important;
  }
`

// keeps its natural width: the search field gives way first, the count stays readable
export const ColumnsFilterSelect = styled(ColumnsSelect)`
  flex: 0 0 auto;
  min-width: 144px;

  /* narrowed, the count ends in an ellipsis rather than a cut word */
  .template-value > div,
  .template-value > div > span {
    min-width: 0;
    overflow: hidden;
  }

  .template-value > div > span > span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

// version statuses as filled pills, the same as the status cells of the project tables
export const ProductsTablePanel = styled(TablePanel)`
  /* the hidden sort icon keeps its space: in a narrow column it would end the label in a
     stray ellipsis, the label truncates on its own */
  && .p-treetable-thead > tr > th {
    text-overflow: clip;
  }

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
