import { Splitter, SplitterPanel } from 'primereact/splitter'
import styled from 'styled-components'
import ProjectStats from './panels/ProjectStats'

// styled grid
const GridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
`

const ProjectDashboard = ({ projectName }) => {
  return (
    <main style={{ flex: 1 }}>
      <Splitter>
        <SplitterPanel size={75}>
          <GridStyled>
            <ProjectStats {...{ projectName }} />
          </GridStyled>
        </SplitterPanel>
        <SplitterPanel size={25}>
          <h1>Project Details</h1>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default ProjectDashboard
