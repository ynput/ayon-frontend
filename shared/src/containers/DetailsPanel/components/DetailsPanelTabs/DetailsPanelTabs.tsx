// The details panel's own tabs: Activity, Subtasks, then Files and Details at the end (the addons'
// tabs go between them, TabbedPanel)
import type { PanelTab } from '@shared/components/PanelTabs'
import type { DetailsPanelEntityType } from '@shared/api'

// Entity types that don't support the feed tab
const entitiesWithoutFeed = ['product', 'representation']

// Entity types that support subtasks tab (only tasks)
const entitiesWithSubtasks = ['task']

export const getDetailsPanelTabs = (entityType: DetailsPanelEntityType): PanelTab[] => {
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
}
