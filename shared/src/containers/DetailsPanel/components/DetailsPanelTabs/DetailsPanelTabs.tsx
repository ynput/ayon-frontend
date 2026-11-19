// The details panel's tabs: Activity, Subtasks, the addons' tabs, then Files and Details at the end
import { FC, useMemo } from 'react'
import type { PanelTab } from '@shared/components/PanelTabs'
import type { DetailsPanelTab } from '@shared/context'
import type { DetailsPanelEntityType } from '@shared/api'
import { useDetailsPanelTabSlot } from '../../hooks/useDetailsPanelTabSlot'
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
  const { slot } = useDetailsPanelTabSlot(entityType)

  const tabs = useMemo(() => {
    const result: PanelTab[] = []
    if (!entitiesWithoutFeed.includes(entityType))
      result.push({ id: 'feed', label: 'Activity', icon: 'forum' })
    if (entitiesWithSubtasks.includes(entityType))
      result.push({ id: 'subtasks', label: 'Subtasks', icon: 'checklist' })
    if (entityType === 'version')
      result.push({ id: 'files', label: 'Files', icon: 'order_play', end: true })
    // the default tab, named on its button as well as in its header
    result.push({ id: 'details', label: 'Details', icon: 'lists', end: true, showLabel: true })
    return result
  }, [entityType])

  return (
    <Styled.Tabs
      tabs={tabs}
      slot={slot}
      selected={currentTab}
      onChange={(tab) => onTabChange(tab as DetailsPanelTab)}
      isLoading={isLoading}
    />
  )
}

export default DetailsPanelTabs
