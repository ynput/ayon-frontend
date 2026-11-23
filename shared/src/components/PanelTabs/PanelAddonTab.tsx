// An addon's panel tab: the header with the tab's label as title, then the tab, which fills the rest
// of the panel. The tab fills the header's menu, search and extra slots with the SDK's
// PanelTabHeader. Panels render it through PanelSlotTab; addons that draw their own panel (Review's
// session sidebar) through the SDK's ContributionTab.
import { useMemo, useState } from 'react'
import { ContributionView } from '@ynput/ayon-addon'
import type { Contribution, SlotMap } from '@ynput/ayon-addon'
import { PanelTabHeader } from './PanelTabHeader'
import { PanelTabHeaderSlotsContext } from './PanelTabHeaderContextInstance'
import type { TabSearchState } from './PanelTabHeaderContextInstance'
import type { PanelTabSlotName } from './usePanelSlotTabs'
import * as Styled from './PanelTabs.styled'

export interface PanelAddonTabProps<S extends PanelTabSlotName> {
  contribution: Contribution<S>
  context: SlotMap[S]['context']
}

export const PanelAddonTab = <S extends PanelTabSlotName>({
  contribution,
  context,
}: PanelAddonTabProps<S>) => {
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const [search, setSearch] = useState<HTMLElement | null>(null)
  const [extra, setExtra] = useState<HTMLElement | null>(null)
  const [searchState, setSearchState] = useState<TabSearchState>({ has: false, active: false })
  const slots = useMemo(() => ({ menu, search, extra, setSearchState }), [menu, search, extra])

  return (
    <PanelTabHeaderSlotsContext.Provider value={slots}>
      <PanelTabHeader
        title={contribution.label}
        hasSearch={searchState.has}
        searchActive={searchState.active}
        slotRefs={{ menu: setMenu, search: setSearch, extra: setExtra }}
      />
      <Styled.AddonTabContent>
        <ContributionView contribution={contribution} context={context} />
      </Styled.AddonTabContent>
    </PanelTabHeaderSlotsContext.Provider>
  )
}
