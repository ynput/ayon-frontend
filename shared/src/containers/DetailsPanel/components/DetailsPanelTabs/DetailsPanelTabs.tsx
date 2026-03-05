// High-level tabs for the details panel: Feed, Subtasks, Details
// Each tab manages its own sub-filters
import { FC } from 'react'
import { Button, Spacer } from '@ynput/ayon-react-components'
import { DetailsPanelTab } from '@shared/context'
import { DetailsPanelEntityType } from '@shared/api'
import * as Styled from './DetailsPanelTabs.styled'

// Entity types that don't support the feed tab
const entitiesWithoutFeed = ['product', 'representation']

// Entity types that support subtasks tab (only tasks)
const entitiesWithSubtasks = ['task']

interface DetailsPanelTabsProps {
  entityType: DetailsPanelEntityType
  currentTab: DetailsPanelTab
  onTabChange: (tab: DetailsPanelTab) => void
  isLoading?: boolean
}

const DetailsPanelTabs: FC<DetailsPanelTabsProps> = ({
  entityType,
  currentTab,
  onTabChange,
  isLoading,
}) => {
  const showFeedTab = !entitiesWithoutFeed.includes(entityType)
  const showSubtasksTab = entitiesWithSubtasks.includes(entityType)
  const showFilesTab = entityType === 'version'

  return (
    <Styled.TabsContainer className={isLoading ? 'loading' : ''}>
      {showFeedTab && (
        <Button
          icon="forum"
          selected={currentTab === 'feed'}
          onClick={() => onTabChange('feed')}
          data-tooltip="Activity Feed"
          data-tooltip-delay={0}
          variant="text"
        />
      )}
      {showSubtasksTab && (
        <Button
          icon="checklist"
          selected={currentTab === 'subtasks'}
          onClick={() => onTabChange('subtasks')}
          data-tooltip="Subtasks"
          data-tooltip-delay={0}
          variant="text"
        />
      )}
      <Spacer />
      {showFilesTab && (
        <Button
          icon="order_play"
          onClick={() => onTabChange('files')}
          selected={currentTab === 'files'}
          data-tooltip="Version files"
          data-tooltip-delay={0}
          variant="text"
        />
      )}
      <Button
        onClick={() => onTabChange('details')}
        selected={currentTab === 'details'}
        style={{ padding: '6px 8px' }}
        variant="text"
      >
        Details
      </Button>
    </Styled.TabsContainer>
  )
}

export default DetailsPanelTabs
