// A panel with tabs: an optional title row with the panel's tools (close, watch, a "more" menu),
// optional content above the tabs (the details panel's summary), the tab bar with the panel's own
// tabs and the tabs addons contribute to its slot, then the open tab. The details panel, a list's
// details panel and Review's session sidebar (through the addon SDK) all use it, so they look and
// behave alike. The panel keeps its own state: which tab is open, its keyboard shortcuts.
import { useEffect, type ReactNode } from 'react'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import type { IconType } from '@ynput/ayon-react-components'
import { PanelSlotTab, PanelTabs, usePanelSlotTabs } from '@shared/components/PanelTabs'
import type { PanelTab, PanelTabSlot, PanelTabSlotName } from '@shared/components/PanelTabs'
import { AddonMoreMenu } from '@shared/components/AddonLayout/AddonMoreMenu'
import * as Styled from './TabbedPanel.styled'

/** A button in the panel's tools, or an item of its "more" menu. */
export interface PanelToolItem {
  id: string
  /** a Material Symbols icon name */
  icon: string
  /** the button's tooltip, or the menu item's text */
  label: string
  onClick: () => void
  /** a button next to the "more" menu; in the menu when not set */
  pinned?: boolean
  /** shown as on (a toggle that is on) */
  active?: boolean
  disabled?: boolean
  hidden?: boolean
  /** the shortcut shown in its tooltip; the panel handles the key itself */
  shortcut?: string
}

/** A tool the panel draws itself (the details panel's watchers): always a button, never in the menu. */
export interface PanelToolElement {
  id: string
  element: ReactNode
  hidden?: boolean
}

export type PanelTool = PanelToolItem | PanelToolElement

export interface TabbedPanelProps<S extends PanelTabSlotName> {
  /** left of the tools, at the top; without it, the tools go at the end of the tab bar */
  title?: ReactNode
  /** between the title row and the tab bar (the details panel's summary) */
  beforeTabs?: ReactNode
  /** the panel's tools, in order; items not `pinned` go in a "more" menu before the others */
  tools?: PanelTool[]
  /** a close button after the tools */
  onClose?: () => void
  /** a tool or "more" menu item that fails; logged when not set */
  onToolError?: (error: unknown) => void
  /** the close button's shortcut, shown in its tooltip; the panel handles the key itself */
  closeShortcut?: string
  /** the panel's own tabs */
  tabs: PanelTab[]
  /** the open tab: a panel tab's id, or an addon tab's contribution key */
  selected: string
  onChange: (tab: string) => void
  /**
   * the slot whose tabs show after the panel's own, with the `context` they get. A `context` of
   * `undefined` means the panel's subject is still loading: its tabs wait for it
   */
  slot?: PanelTabSlot<S>
  /**
   * opened instead of a `selected` tab that is neither the panel's nor an addon's (its addon is
   * gone), once that is known: the addons have loaded and so has the slot's context
   */
  fallbackTab?: string
  /** the panel falls back to `fallbackTab` (a URL tab should replace its entry); `onChange` when not set */
  onFallback?: (tab: string) => void
  /** labels next to the icons on every tab; off by default (icons, the label is the tooltip) */
  showLabels?: boolean
  isLoading?: boolean
  /** a test id for each tab button, by tab id */
  tabTestId?: (id: string) => string
  /** the open tab when it is one of the panel's own, with its PanelTabHeader */
  children?: ReactNode
  className?: string
  'data-testid'?: string
}

const isElement = (tool: PanelTool): tool is PanelToolElement => 'element' in tool

const logError = (error: unknown) => console.error(error)

const PanelTools = ({
  tools = [],
  onClose,
  closeShortcut,
  onToolError = logError,
}: Pick<
  TabbedPanelProps<PanelTabSlotName>,
  'tools' | 'onClose' | 'closeShortcut' | 'onToolError'
>) => {
  const shown = tools.filter((tool) => !tool.hidden)
  const menuItems = shown.filter((tool): tool is PanelToolItem => !isElement(tool) && !tool.pinned)
  if (!shown.length && !onClose) return null

  return (
    <Styled.Tools className="tabbed-panel-tools">
      {!!menuItems.length && (
        <AddonMoreMenu
          items={menuItems.map(({ id, icon, label, onClick, disabled }) => ({
            id,
            icon,
            label,
            onClick,
            disabled,
          }))}
          onError={onToolError}
        />
      )}
      {shown.map((tool) =>
        isElement(tool) ? (
          <span key={tool.id} style={{ display: 'contents' }}>
            {tool.element}
          </span>
        ) : tool.pinned ? (
          <Button
            key={tool.id}
            icon={tool.icon as IconType}
            variant="text"
            selected={tool.active}
            disabled={tool.disabled}
            onClick={() => {
              // as the menu's items: a failing tool is reported, not lost
              Promise.resolve().then(tool.onClick).catch(onToolError)
            }}
            aria-label={tool.label}
            data-tooltip={tool.label}
            data-shortcut={tool.shortcut}
          />
        ) : null,
      )}
      {onClose && (
        <Button icon="close" variant="text" onClick={onClose} data-shortcut={closeShortcut} />
      )}
    </Styled.Tools>
  )
}

export const TabbedPanel = <S extends PanelTabSlotName>({
  title,
  beforeTabs,
  tools,
  onClose,
  closeShortcut,
  onToolError,
  tabs,
  selected,
  onChange,
  slot,
  fallbackTab,
  onFallback,
  showLabels,
  isLoading,
  tabTestId,
  children,
  className,
  'data-testid': testId,
}: TabbedPanelProps<S>) => {
  const { tabs: slotTabs, isLoading: isLoadingSlot } = usePanelSlotTabs(slot)
  const isOwnTab = tabs.some((tab) => tab.id === selected)
  // a tab that is neither the panel's nor an addon's, once the addons and the subject have loaded
  const isGone =
    !isOwnTab &&
    !slotTabs.some((tab) => tab.key === selected) &&
    !isLoadingSlot &&
    (!slot || slot.context !== undefined)
  useEffect(() => {
    if (fallbackTab && isGone) (onFallback ?? onChange)(fallbackTab)
  }, [fallbackTab, isGone, onFallback, onChange])

  const toolsNode = (
    <PanelTools
      tools={tools}
      onClose={onClose}
      closeShortcut={closeShortcut}
      onToolError={onToolError}
    />
  )
  const hasTitle = title !== undefined && title !== null

  return (
    <Styled.Panel className={clsx('tabbed-panel', className)} data-testid={testId}>
      {hasTitle && (
        <Styled.TopRow className="tabbed-panel-top">
          <Styled.Title className="tabbed-panel-title">{title}</Styled.Title>
          {toolsNode}
        </Styled.TopRow>
      )}
      <Styled.Head className="tabbed-panel-head">
        {beforeTabs}
        <Styled.TabRow className="tabbed-panel-tabs">
          <PanelTabs
            tabs={tabs}
            // the slot's tabs wait for the subject (its context): until then, which fit and what they
            // would show is not known
            slot={slot?.context === undefined ? undefined : slot}
            selected={selected}
            onChange={onChange}
            showLabels={showLabels}
            isLoading={isLoading}
            tabTestId={tabTestId}
          />
          {!hasTitle && toolsNode}
        </Styled.TabRow>
      </Styled.Head>
      {/* an addon's tab, with its own header; nothing while the slot's context loads */}
      {slot && <PanelSlotTab slot={slot} selected={selected} />}
      {isOwnTab && children}
    </Styled.Panel>
  )
}
