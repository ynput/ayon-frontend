// A panel's tab bar: the panel's own tabs, then the tabs addons contribute to its slot, then the
// panel's `end` tabs. Every panel with tabs uses it (the details panel, a list's details panel).
// Icon-only by default: the label is the button's tooltip and the title of the open tab's header
// (PanelTabHeader). The content of an addon tab is PanelSlotTab.
import clsx from 'clsx'
import { Button, Spacer } from '@ynput/ayon-react-components'
import type { IconType } from '@ynput/ayon-react-components'
import { prefetchPiece } from '@ynput/ayon-addon'
import { contributionTags } from '@ynput/ayon-addon/host'
import { usePanelSlotTabs } from './usePanelSlotTabs'
import type { PanelTabSlot, PanelTabSlotName } from './usePanelSlotTabs'
import * as Styled from './PanelTabs.styled'

/** One of the panel's own tabs. */
export interface PanelTab {
  id: string
  label: string
  icon: IconType
  /** at the end of the bar, after the addons' tabs */
  end?: boolean
  /** its label next to the icon even in an icon-only bar (the details panel's Details) */
  showLabel?: boolean
}

export interface PanelTabsProps<S extends PanelTabSlotName> {
  /** the panel's own tabs */
  tabs: PanelTab[]
  /** the open tab: a panel tab's id, or an addon tab's contribution key */
  selected: string
  onChange: (tab: string) => void
  /** the slot whose tabs show after the panel's own (and before its `end` tabs) */
  slot?: PanelTabSlot<S>
  /** labels next to the icons on every tab; off by default (icons, the label is the tooltip) */
  showLabels?: boolean
  isLoading?: boolean
  /** a test id for each tab button, by tab id (a panel tab's id or an addon tab's key) */
  tabTestId?: (id: string) => string
  className?: string
}

export const PanelTabs = <S extends PanelTabSlotName>({
  tabs,
  selected,
  onChange,
  slot,
  showLabels,
  isLoading,
  tabTestId,
  className,
}: PanelTabsProps<S>) => {
  // the buttons show from the descriptions; a tab's code loads when it is opened
  const { tabs: slotTabs } = usePanelSlotTabs(slot)

  // icon-only tabs keep their width whichever is open; the open tab is named in its header. With
  // `showLabels`, a panel may hide the labels when it is narrow (`.panel-tab-label`): the tooltip
  // and the accessible name stay
  const tabProps = (id: string, label: string, withLabel?: boolean, tooltip?: string) => {
    const hint = tooltip || (withLabel ? undefined : label)
    return {
      selected: selected === id,
      ...(tabTestId && { 'data-testid': tabTestId(id) }),
      variant: 'text' as const,
      'aria-label': label,
      ...((withLabel || showLabels) && {
        children: <span className="panel-tab-label">{label}</span>,
      }),
      ...(hint && { 'data-tooltip': hint, 'data-tooltip-delay': 0 }),
    }
  }

  const renderTab = (tab: PanelTab) => (
    <Button
      key={tab.id}
      icon={tab.icon}
      onClick={() => onChange(tab.id)}
      {...tabProps(tab.id, tab.label, tab.showLabel)}
    />
  )
  const endTabs = tabs.filter((tab) => tab.end)

  return (
    <Styled.TabsContainer className={clsx(className, { loading: isLoading })}>
      {tabs.filter((tab) => !tab.end).map(renderTab)}
      {slotTabs.map((tab) => (
        <Button
          key={tab.key}
          // addons name any Material Symbols icon
          icon={tab.icon as IconType}
          onClick={() => onChange(tab.key)}
          onMouseEnter={() => prefetchPiece(tab.component)}
          data-addon-tab={tab.key}
          {...tabProps(tab.key, tab.label, false, tab.tooltip)}
          // the slot inspector's tags, while it is on
          {...contributionTags(tab)}
        />
      ))}
      {!!endTabs.length && <Spacer />}
      {endTabs.map(renderTab)}
    </Styled.TabsContainer>
  )
}
