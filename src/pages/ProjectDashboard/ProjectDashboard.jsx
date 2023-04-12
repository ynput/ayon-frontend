import styled from 'styled-components'
import HeartBeat from './panels/HeartBeat'
import ProjectStats from './panels/ProjectStats'
import ProjectUsers from './panels/ProjectUsers'
import Timeline from './panels/Timeline'
import { Section } from 'ayon-react-components-test'
import ProjectHealth from './panels/ProjectHealth'
import DashboardPanelsContainer from './panels/DashboardPanelsContainer'
import ProjectLatest from './panels/ProjectLatest'
import ProjectDetails from './panels/ProjectDetails'
import ProjectTeams from './panels/ProjectTeams'

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
  height: 100%;
  overflow: hidden;
`

const ProjectDashboard = ({ projectName }) => {
  return (
    <Section
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(300px, 20vw)',
        height: `calc(100% + 8px)`,
        alignItems: 'start',
      }}
    >
      <PanelsContainerStyled>
        <HeaderGridStyled>
          <HeartBeat {...{ projectName }} />
          <Timeline {...{ projectName }} />
        </HeaderGridStyled>
        <DashboardPanelsContainer projectName={projectName}>
          <ProjectStats column={1} />
          <ProjectHealth column={1} />
          <ProjectUsers column={2} />
          <ProjectTeams column={2} />
          <ProjectLatest column={3} />
        </DashboardPanelsContainer>
      </PanelsContainerStyled>
      <ProjectDetails projectName={projectName} />
    </Section>
  )
}

export default ProjectDashboard
