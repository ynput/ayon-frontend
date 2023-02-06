import { Splitter, SplitterPanel } from 'primereact/splitter'
import styled from 'styled-components'
import HeartBeat from './panels/HeartBeat'
import ProjectStats from './panels/ProjectStats'

// top grid
const HeaderGridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
`

// styled grid
const GridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
`

const ProjectDashboard = ({ projectName }) => {
  return (
    <main style={{ flex: 1 }}>
      <Splitter>
        <SplitterPanel size={75} style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
          <HeaderGridStyled>
            <HeartBeat {...{ projectName }} />
          </HeaderGridStyled>
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
