import type { Contribution } from './contributions'
import { ContributionView } from './ContributionView'
import { getHost } from './hostBridge'
import type { SlotMap } from './slots'

/** The slots whose contributions are panel tabs: a button in a panel's tabs and the tab itself. */
export type PanelTabSlotName = 'detailsPanel.tab' | 'listDetails.tab'

export interface ContributionTabProps<S extends PanelTabSlotName> {
  contribution: Contribution<S>
  /** the slot's context, as `ContributionView` takes it; memoize it */
  context: SlotMap[S]['context']
}

/**
 * Renders a panel tab contribution the way AYON's panels do: a header titled with the tab's
 * `label`, which the tab fills with `PanelTabHeader`, then the tab, filling the rest of the panel.
 * For an addon that draws a panel with other addons' tabs (Review's session sidebar shows
 * `listDetails.tab`). On an AYON without it, the tab alone (`ContributionView`).
 */
export const ContributionTab = <S extends PanelTabSlotName>(props: ContributionTabProps<S>) => {
  const Host = getHost().components?.ContributionTab
  if (Host) return <Host {...(props as ContributionTabProps<PanelTabSlotName>)} />
  return <ContributionView contribution={props.contribution} context={props.context} />
}
