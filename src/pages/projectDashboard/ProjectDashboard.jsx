import { Splitter, SplitterPanel } from 'primereact/splitter'
import styled from 'styled-components'
import HeartBeat from './panels/HeartBeat'
import ProjectStats from './panels/ProjectStats'
import ProjectUsers from './panels/ProjectUsers'
import Timeline from './panels/Timeline'
import { Section } from '@ynput/ayon-react-components'
import ProjectHealth from './panels/ProjectHealth'
import GridLayout from './panels/GridLayout'
import ProjectLatest from './panels/ProjectLatest'

// top grid
const HeaderGridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
`

const ProjectDashboard = ({ projectName }) => {
  return (
    <Section>
      <Splitter gutterSize={8} style={{ maxHeight: '100%' }}>
        <SplitterPanel size={75} style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
          <HeaderGridStyled>
            <HeartBeat {...{ projectName }} />
            <Timeline {...{ projectName }} />
          </HeaderGridStyled>
          <GridLayout projectName={projectName}>
            <ProjectStats rows={1} />
            <ProjectUsers rows={2} />
            <ProjectLatest rows={2} />
            <ProjectHealth rows={1} />
          </GridLayout>
        </SplitterPanel>
        <SplitterPanel size={25}>
          <h1>Project Details</h1>
        </SplitterPanel>
      </Splitter>
    </Section>
  )
}

export default ProjectDashboard
