import styled from 'styled-components'
import { TablePanel } from '@ynput/ayon-react-components'

// the title row of a list pane (hierarchy, tasks, workfiles) is a panel header, like the slicer
// header on the other project pages, not a filled table header
export const FlatHeaderTablePanel = styled(TablePanel)`
  --color-table-header: transparent;
  /* rows show the panel surface, so the body is one colour down to the panel's end, as in Overview */
  --color-table-row: transparent;

  /* collapsed borders: the row's wider line would win over the header's */
  && .p-treetable-thead > tr,
  && .p-datatable-thead > tr {
    border-bottom: none;
  }

  && .p-treetable-thead > tr > th,
  && .p-datatable-thead > tr > th {
    height: 34px;
    padding: 0 10px;
    background-color: transparent;
    font-weight: normal;
    border-right: none;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
`
