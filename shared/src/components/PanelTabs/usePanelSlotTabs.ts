import { useMemo } from 'react'
import { useContributions } from '@ynput/ayon-addon'
import type { Contribution, SlotMap } from '@ynput/ayon-addon'

/** The slots whose contributions are panel tabs: a button in a panel's tab bar and the tab itself. */
export type PanelTabSlotName = 'detailsPanel.tab' | 'listDetails.tab'

/** The slot a panel's tabs take addon tabs from. */
export interface PanelTabSlot<S extends PanelTabSlotName = PanelTabSlotName> {
  name: S
  /**
   * which of the slot's tabs show in this panel (the details panel's, by entity type); keep it
   * stable. A method, so a panel typed for any slot (a styled PanelTabs) takes a slot of its own.
   */
  filter?(tab: Contribution<S>): boolean
  /** what the slot's tabs get (TabbedPanel); `undefined` while the panel's subject loads */
  context?: SlotMap[S]['context']
}

const NONE: never[] = []

// The tabs addons contribute to a panel (the slot's contributions that pass its filter). A tab's id
// is its contribution key, `<addon>.<id>`. Without a slot there are none: the hook still subscribes
// to a slot, since hooks can't be skipped.
export const usePanelSlotTabs = <S extends PanelTabSlotName>(slot?: PanelTabSlot<S>) => {
  const { contributions, isLoading } = useContributions(slot?.name ?? 'detailsPanel.tab')
  const name = slot?.name
  const filter = slot?.filter
  const tabs = useMemo(() => {
    if (!name) return NONE as Contribution<S>[]
    const all = contributions as Contribution<S>[]
    return filter ? all.filter(filter) : all
  }, [contributions, filter, name])
  return { tabs, isLoading: !!name && isLoading }
}
