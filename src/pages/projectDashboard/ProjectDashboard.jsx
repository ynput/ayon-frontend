import { Splitter, SplitterPanel } from 'primereact/splitter'
import styled from 'styled-components'
import HeartBeat from './panels/HeartBeat'
import ProjectStats from './panels/ProjectStats'
import Timeline from './panels/Timeline'

// top grid
const HeaderGridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
`

// styled grid
const GridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
`

const ProjectDashboard = ({ projectName }) => {
  return (
    <main style={{ flex: 1 }}>
      <Splitter gutterSize={8}>
        <SplitterPanel size={75} style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
          <HeaderGridStyled>
            <HeartBeat {...{ projectName }} />
            <Timeline {...{ projectName }} />
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
