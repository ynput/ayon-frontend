import { useMemo } from 'react'
import { usePanelSlotTabs } from '@shared/components/PanelTabs'
import type { PanelTabSlot } from '@shared/components/PanelTabs'

// The details panel's addon tabs (detailsPanel.tab slot, @ynput/ayon-addon): those for the entity
// type it shows. The tab id is the contribution key, `<addon>.<id>` (DetailsPanelTab allows those).
export const useDetailsPanelTabSlot = (entityType: string) => {
  const slot = useMemo<PanelTabSlot<'detailsPanel.tab'>>(
    () => ({
      name: 'detailsPanel.tab',
      filter: (tab) => !tab.entityTypes?.length || tab.entityTypes.includes(entityType),
    }),
    [entityType],
  )
  return { slot, ...usePanelSlotTabs(slot) }
}
