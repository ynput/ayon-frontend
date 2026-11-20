import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import type { PanelTabSlotName } from './ContributionTab'
import { getHost } from './hostBridge'
import { Missing } from './layout'
import type { SlotMap } from './slots'
import { useMenuErrorHandler } from './useContextMenu'

/** One of the panel's own tabs: a button in its tab bar. */
export interface PanelTab {
  id: string
  label: string
  /** a Material Symbols icon name */
  icon: string
  /** at the end of the bar, after the addons' tabs */
  end?: boolean
  /** its label next to the icon even when the bar shows icons only */
  showLabel?: boolean
}

/**
 * More props for a tool's button: a tool that changes its look (a running timer) sets its
 * `variant`, `className` or `style`. An item of the "more" menu takes its `className`, `style` and
 * `data-*`.
 */
export type PanelToolButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  ref?: Ref<HTMLButtonElement>
  /** AYON's button styles; `text` by default */
  variant?: 'surface' | 'tonal' | 'filled' | 'nav' | 'text' | 'tertiary' | 'danger'
  /** shown as selected */
  selected?: boolean
  [key: `data-${string}`]: string | undefined
}

/** A button in the panel's tools, or an item of its "more" (…) menu. */
export interface PanelToolItem {
  id: string
  /** a Material Symbols icon name */
  icon: string
  /** the button's tooltip, or the menu item's text */
  label: string
  /** a failing `onClick` is shown as a toast naming the addon */
  onClick: () => void
  /** a button next to the "more" menu; in the menu when not set */
  pinned?: boolean
  /** shown as on (a toggle that is on) */
  active?: boolean
  disabled?: boolean
  hidden?: boolean
  /** the shortcut shown in its tooltip; the addon handles the key itself */
  shortcut?: string
  /** its tooltip when that is not `label` (why it is disabled) */
  tooltip?: string
  /** deletes or breaks something: red, in the menu's bottom section */
  danger?: boolean
  /** loads what `onClick` needs: on the pointer over its button, or when its menu opens */
  onPrefetch?: () => void
  buttonProps?: PanelToolButtonProps
}

/** A line between the "more" menu's items, starting a section; lines left at an end go. */
export interface PanelToolDivider {
  divider: true
  id?: string
  hidden?: boolean
}

/** A tool the addon draws itself: always shown, never in the menu. */
export interface PanelToolElement {
  id: string
  element: ReactNode
  hidden?: boolean
}

export type PanelTool = PanelToolItem | PanelToolElement | PanelToolDivider

/** The slot whose tabs the panel shows after its own, and what they get. */
export interface TabbedPanelSlot<S extends PanelTabSlotName = PanelTabSlotName> {
  name: S
  /**
   * the slot's context; `undefined` while the panel's subject loads (the tabs wait for it). The
   * slot's own rules apply: a `listDetails.tab` with `entityListTypes` shows on those lists only.
   * Memoize it
   */
  context: SlotMap[S]['context'] | undefined
}

export interface TabbedPanelProps<S extends PanelTabSlotName = PanelTabSlotName> {
  /** left of the tools, at the top; without it, the tools go at the end of the tab bar */
  title?: ReactNode
  /** between the title and the tab bar (a summary of what the panel shows) */
  beforeTabs?: ReactNode
  /** the panel's tools, in order; items not `pinned` go in a "more" menu, where its first one is */
  tools?: PanelTool[]
  /** more props for the "more" button (its tooltip, test hooks), "More" by default */
  moreButtonProps?: PanelToolButtonProps
  /** a close button after the tools */
  onClose?: () => void
  /** the close button's shortcut, shown in its tooltip; the addon handles the key itself */
  closeShortcut?: string
  /** the panel's own tabs */
  tabs: PanelTab[]
  /** the open tab: one of `tabs`, or an addon tab's contribution key (`<addon>.<id>`) */
  selected: string
  /** the user opens a tab (and the panel falls back to `fallbackTab`, without `onFallback`) */
  onChange: (tab: string) => void
  /** the slot whose tabs show after the panel's own (and before its `end` tabs) */
  slot?: TabbedPanelSlot<S>
  /**
   * opened instead of a `selected` tab that is neither the panel's nor an addon's (its addon is
   * gone), once the addons and the slot's context have loaded
   */
  fallbackTab?: string
  /**
   * the panel falls back to `fallbackTab`; `onChange` when not set. A tab kept in the URL should
   * replace its entry here: a pushed fallback brings Back to the gone tab, which falls back again
   */
  onFallback?: (tab: string) => void
  /** labels next to the icons on every tab; icons only when not set (the label is the tooltip) */
  showLabels?: boolean
  /** the tab bar shows as loading */
  isLoading?: boolean
  /** a test id for each tab button, by tab id */
  tabTestId?: (id: string) => string
  /** the open tab when it is one of the panel's own */
  children?: ReactNode
  className?: string
  'data-testid'?: string
}

/** What the host's `TabbedPanel` gets: the addon's props and where to report a failing tool. */
export interface HostTabbedPanelProps extends TabbedPanelProps<PanelTabSlotName> {
  onError: (error: unknown) => void
}

/**
 * AYON's panel with tabs, as its details panels draw it: a title with the panel's tools, the tab
 * bar with the panel's own tabs and the tabs other addons contribute to `slot`, then the open tab.
 * An addon tab draws itself with its header; the panel's own tab is `children`. The addon keeps
 * which tab is open. An AYON older than this component has no such export (`undefined`): an addon
 * that supports one checks `TabbedPanel &&` and draws its own panel otherwise.
 *
 * ```tsx
 * const [tab, setTab] = useState('notes')
 * const slot = useMemo(() => ({ name: 'listDetails.tab' as const, context }), [context])
 * <TabbedPanel
 *   tabs={[{ id: 'notes', label: 'Notes', icon: 'notes' }]}
 *   selected={tab}
 *   onChange={setTab}
 *   slot={slot}
 *   fallbackTab="notes"
 *   tools={[{ id: 'hide', icon: 'right_panel_close', label: 'Hide', onClick: hide, pinned: true }]}
 * >
 *   <Notes />
 * </TabbedPanel>
 * ```
 */
export const TabbedPanel = <S extends PanelTabSlotName>(props: TabbedPanelProps<S>) => {
  const onError = useMenuErrorHandler()
  const Host = getHost().components?.TabbedPanel
  return Host ? (
    <Host {...(props as TabbedPanelProps<PanelTabSlotName>)} onError={onError} />
  ) : (
    <Missing name="TabbedPanel" />
  )
}
