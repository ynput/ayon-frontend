import { useMemo } from 'react'
import { useContributions } from '@ynput/ayon-addon'

// Tabs addons contribute to the details panel (detailsPanel.tab slot, @ynput/ayon-addon). The tab
// id is the contribution key, `<addon>.<id>` (DetailsPanelTab allows those).
export const useAddonTabs = (entityType: string) => {
  const { contributions, isLoading } = useContributions('detailsPanel.tab')
  const tabs = useMemo(
    () =>
      contributions.filter(
        (tab) => !tab.entityTypes?.length || tab.entityTypes.includes(entityType),
      ),
    [contributions, entityType],
  )
  return { tabs, isLoading }
}
