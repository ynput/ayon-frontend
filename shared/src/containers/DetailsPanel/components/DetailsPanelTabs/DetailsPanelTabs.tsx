// High-level tabs for the details panel: Feed, Subtasks, Details
// Each tab manages its own sub-filters
import { FC } from 'react'
import { Button } from '@ynput/ayon-react-components'
import type { IconType } from '@ynput/ayon-react-components'
import { prefetchPiece } from '@ynput/ayon-addon'
import type { DetailsPanelTab } from '@shared/context'
import type { DetailsPanelEntityType } from '@shared/api'
import { useAddonTabs } from '../../hooks/useAddonTabs'
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
  // the buttons show from the descriptions; a tab's code loads when it is opened
  const { tabs: addonTabs } = useAddonTabs(entityType)

  // icon tabs look alike (two speech bubbles), so the open one also shows its name;
  // the others keep it as a tooltip
  const iconTabProps = (tab: string, label: string) => {
    const selected = currentTab === tab
    return {
      selected,
      children: selected ? label : undefined,
      'data-tooltip': selected ? undefined : label,
      'data-tooltip-delay': 0,
      variant: 'text' as const,
    }
  }

  return (
    <Styled.TabsContainer className={isLoading ? 'loading' : ''}>
      {showFeedTab && (
        <Button
          icon="forum"
          onClick={() => onTabChange('feed')}
          {...iconTabProps('feed', 'Activity')}
        />
      )}
      {showSubtasksTab && (
        <Button
          icon="checklist"
          onClick={() => onTabChange('subtasks')}
          {...iconTabProps('subtasks', 'Subtasks')}
        />
      )}
      {addonTabs.map((tab) => (
        <Button
          key={tab.key}
          // addons name any Material Symbols icon
          icon={tab.icon as IconType}
          onClick={() => onTabChange(tab.key as DetailsPanelTab)}
          onMouseEnter={() => prefetchPiece(tab.component)}
          data-addon-tab={tab.key}
          {...iconTabProps(tab.key, tab.label)}
        />
      ))}
      {showFilesTab && (
        <Button
          icon="order_play"
          onClick={() => onTabChange('files')}
          {...iconTabProps('files', 'Files')}
        />
      )}
      <Button
        icon="lists"
        onClick={() => onTabChange('details')}
        selected={currentTab === 'details'}
        variant="text"
      >
        Details
      </Button>
    </Styled.TabsContainer>
  )
}

export default DetailsPanelTabs
