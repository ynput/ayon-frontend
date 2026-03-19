import { Splitter } from 'primereact/splitter'
import styled from 'styled-components'

// hides the details panel splitter panel and gutter when empty
// IMPORTANT: requires the splitter panel to have className "details"
const DetailsPanelSplitter = styled(Splitter)`
  &:has(.p-splitter-panel.details:empty) {
    .p-splitter-panel.details {
      display: none;
    }
    .p-splitter-gutter {
      display: none;
    }
  }
`

export default DetailsPanelSplitter
