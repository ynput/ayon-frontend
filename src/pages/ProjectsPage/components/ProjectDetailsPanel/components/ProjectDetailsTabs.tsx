import { FC } from 'react'
import { Button, Spacer, Toolbar } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export type ProjectDetailsTab = 'details' | 'teams'

const TabsContainer = styled(Toolbar)`
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  gap: var(--base-gap-small) !important;
  position: relative;
  z-index: 100;
  padding: 4px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

interface ProjectDetailsTabsProps {
  currentTab: ProjectDetailsTab
  onTabChange: (tab: ProjectDetailsTab) => void
  isLoading?: boolean
}

const ProjectDetailsTabs: FC<ProjectDetailsTabsProps> = ({
  currentTab,
  onTabChange,
  isLoading,
}) => {
  return (
    <TabsContainer className={isLoading ? 'loading' : ''}>
      <Button
        icon="info"
        selected={currentTab === 'details'}
        onClick={() => onTabChange('details')}
        data-tooltip="Details"
        data-tooltip-delay={0}
        variant="text"
        style={{ padding: '6px 8px', gap: 4 }}
      >
        Details
      </Button>
      <Button
        icon="group"
        selected={currentTab === 'teams'}
        onClick={() => onTabChange('teams')}
        data-tooltip="Teams"
        data-tooltip-delay={0}
        variant="text"
        style={{ padding: '6px 8px', gap: 4 }}
      >
        Teams
      </Button>
      <Spacer />
    </TabsContainer>
  )
}

export default ProjectDetailsTabs
