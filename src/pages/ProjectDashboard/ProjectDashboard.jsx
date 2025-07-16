import styled from 'styled-components'
import HeartBeat from './panels/HeartBeat'
import ProjectStats from './panels/ProjectStats'
import ProjectUsers from './panels/ProjectUsers'
import Timeline from './panels/Timeline'
import { Section } from '@ynput/ayon-react-components'
// import ProjectHealth from './panels/ProjectHealth'
import DashboardPanelsContainer from './panels/DashboardPanelsContainer'
import ProjectLatest from './panels/ProjectLatest'
import ProjectDetails from './panels/ProjectDetails/ProjectDetails'
import ProjectTeams from './panels/ProjectTeams'
import ProjectManagerPageLayout from '../ProjectManagerPage/ProjectManagerPageLayout'
import { ProjectContextProvider } from '@shared/context/ProjectContext'

// top grid
const HeaderGridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--base-gap-large);
`

const PanelsContainerStyled = styled.div`
  gap: var(--base-gap-large);
  display: flex;
  flex-direction: column;
  align-self: baseline;
  flex: 3;
  height: 100%;
  overflow: hidden;
`

const ProjectDashboard = ({ projectName }) => {
  return (
    <ProjectManagerPageLayout passthrough>
      {projectName && (
        <ProjectContextProvider projectName={projectName}>
        <Section
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(400px, 20vw)',
            alignItems: 'start',
            height: '100%',
          }}
        >
          <PanelsContainerStyled>
            <HeaderGridStyled>
              <HeartBeat {...{ projectName }} />
              <Timeline {...{ projectName }} />
            </HeaderGridStyled>
            <DashboardPanelsContainer projectName={projectName}>
              <ProjectStats column={1} />
              {/* <ProjectHealth column={1} /> */}
              <ProjectUsers column={2} />
              <ProjectTeams column={2} />
              <ProjectLatest column={3} />
            </DashboardPanelsContainer>
          </PanelsContainerStyled>
          <ProjectDetails projectName={projectName} />
        </Section>
        </ProjectContextProvider>
      )}
    </ProjectManagerPageLayout>
  )
}

export default ProjectDashboard
