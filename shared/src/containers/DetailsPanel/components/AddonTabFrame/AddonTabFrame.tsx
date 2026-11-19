// An addon's details panel tab: the header with the tab's label as title, then the tab. The tab
// fills the header's menu, search and extra slots with the SDK's DetailsPanelTabHeader.
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  DetailsPanelTabHeader,
  DetailsPanelTabHeaderSlotsContext,
} from '@shared/components/DetailsPanelTabHeader'
import type { TabSearchState } from '@shared/components/DetailsPanelTabHeader'

interface AddonTabFrameProps {
  title: string
  children: ReactNode
}

export const AddonTabFrame = ({ title, children }: AddonTabFrameProps) => {
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const [search, setSearch] = useState<HTMLElement | null>(null)
  const [extra, setExtra] = useState<HTMLElement | null>(null)
  const [searchState, setSearchState] = useState<TabSearchState>({ has: false, active: false })
  const slots = useMemo(() => ({ menu, search, extra, setSearchState }), [menu, search, extra])

  return (
    <DetailsPanelTabHeaderSlotsContext.Provider value={slots}>
      <DetailsPanelTabHeader
        title={title}
        hasSearch={searchState.has}
        searchActive={searchState.active}
        slotRefs={{ menu: setMenu, search: setSearch, extra: setExtra }}
      />
      {children}
    </DetailsPanelTabHeaderSlotsContext.Provider>
  )
}
