import { Splitter } from 'primereact/splitter'
import styled from 'styled-components'

// the project list next to a dashboard page
export const ProjectsListSplitter = styled(Splitter)`
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;

  .p-splitter-gutter {
    z-index: 50;
  }
`
