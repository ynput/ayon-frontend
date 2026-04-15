// this is basically a wrapper around ProjectListsPage
// In this page we determine if the review addon is installed
// and if so, we render the ProjectListsPage otherwise show a splash screen to subscribe

import { FC } from 'react'
import ProjectListsPage from '.'
import LoadingPage from '@pages/LoadingPage'
import styled from 'styled-components'
import { PowerpackDialog } from '@shared/components'

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  overflow: hidden;
`

const BGImage = styled.img`
  position: absolute;
  inset: 0;
  top: -4px;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;

  /* blur */
  filter: blur(2px);
  opacity: 0.5;
`

interface ProjectStoryboardsPageProps {
  projectName: string
  hasStoryboardsAddon: boolean
  isLoadingAccess: boolean
}

const ProjectStoryboardsPage: FC<ProjectStoryboardsPageProps> = ({
  projectName,
  hasStoryboardsAddon,
  isLoadingAccess,
}) => {
  if (isLoadingAccess) return <LoadingPage />

  if (hasStoryboardsAddon) {
    return (
      <ProjectListsPage
        projectName={projectName}
        entityListTypes={['storyboard']}
        isReview
        isStoryboards
      />
    )
  }

  return (
    <Container>
      <BGImage src="/splash/review-splash.png" alt="Storyboards Addon Splash" />
      <PowerpackDialog
        label="Storyboards"
        description="Create storyboards directly in AYON."
        isCloseable={false}
        addon={{ icon: 'subscriptions' }}
        features={{
          playback: {
            icon: 'speed',
            bullet: 'Fast, frame-accurate playback with no lag.',
          },
          annotations: {
            icon: 'draw',
            bullet: 'Creative drawing and automatic product creation + versioning.',
          },
          comparison: {
            icon: 'compare_arrows',
            bullet: 'Side-by-side and overlay version comparison.',
          },
          controls: {
            icon: 'tune',
            bullet: 'Extensive view controls and skipable handles.',
          },
          syncedStoryboarding: {
            icon: 'sync',
            bullet: 'Real-time synced sessions for collaborative storyboarding.',
          },
        }}
      />
    </Container>
  )
}

export default ProjectStoryboardsPage
