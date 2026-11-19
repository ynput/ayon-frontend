// The open addon tab of a panel (its PanelTabs `slot`), or nothing when the open tab is one of the
// panel's own. Opening another tab mounts it anew; the same tab keeps its state when the panel's
// subject changes, and gets the new context.
import type { SlotMap } from '@ynput/ayon-addon'
import { PanelAddonTab } from './PanelAddonTab'
import { usePanelSlotTabs } from './usePanelSlotTabs'
import type { PanelTabSlot, PanelTabSlotName } from './usePanelSlotTabs'

export interface PanelSlotTabProps<S extends PanelTabSlotName> {
  slot: PanelTabSlot<S>
  /** the open tab (PanelTabs `selected`) */
  selected: string
  /** what the slot's tabs get; none renders while it is not set (the panel's subject loads) */
  context: SlotMap[S]['context'] | undefined
}

export const PanelSlotTab = <S extends PanelTabSlotName>({
  slot,
  selected,
  context,
}: PanelSlotTabProps<S>) => {
  const { tabs } = usePanelSlotTabs(slot)
  const tab = tabs.find((t) => t.key === selected)
  if (!tab || !context) return null
  return <PanelAddonTab key={tab.key} contribution={tab} context={context} />
}
