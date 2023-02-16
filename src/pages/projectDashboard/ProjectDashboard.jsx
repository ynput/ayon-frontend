import styled from 'styled-components'
import HeartBeat from './panels/HeartBeat'
import ProjectStats from './panels/ProjectStats'
import ProjectUsers from './panels/ProjectUsers'
import Timeline from './panels/Timeline'
import { Section } from '@ynput/ayon-react-components'
import ProjectHealth from './panels/ProjectHealth'
import GridLayout from './panels/GridLayout'
import ProjectLatest from './panels/ProjectLatest'
import ProjectDetails from './panels/ProjectDetails'

// top grid
const HeaderGridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
`

const PanelsContainerStyled = styled.div`
  gap: 8px;
  display: flex;
  flex-direction: column;
  align-self: baseline;
  flex: 3;
`

const ProjectDashboard = ({ projectName }) => {
  return (
    <Section style={{ flexDirection: 'row' }}>
      <PanelsContainerStyled>
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
      </PanelsContainerStyled>
      <ProjectDetails projectName={projectName} />
    </Section>
  )
}

export default ProjectDashboard
