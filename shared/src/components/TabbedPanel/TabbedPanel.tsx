// A panel with tabs: an optional title row with the panel's tools (close, watch, a "more" menu),
// optional content above the tabs (the details panel's summary), the tab bar with the panel's own
// tabs and the tabs addons contribute to its slot, then the open tab. The details panel, a list's
// details panel and Review's session sidebar (through the addon SDK) all use it, so they look and
// behave alike. The panel keeps its own state: which tab is open, its keyboard shortcuts.
import { useEffect, type ReactNode, type Ref } from 'react'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import type { ButtonProps, IconType } from '@ynput/ayon-react-components'
import { PanelSlotTab, PanelTabs, usePanelSlotTabs } from '@shared/components/PanelTabs'
import type { PanelTab, PanelTabSlot, PanelTabSlotName } from '@shared/components/PanelTabs'
import type { MenuItemType } from '@shared/components/Menu/Menu'
import { MENU_DIVIDER } from '@shared/components/Menu/menuSections'
import { MoreMenuButton } from '@shared/components/Menu/MoreMenuButton'
import * as Styled from './TabbedPanel.styled'

/**
 * More props for a tool's button (`variant`, `className`, `style`, `ref`, `data-*`): a tool that
 * changes its look (a running timer) sets them. An item of the "more" menu takes its `className`,
 * `style` and `data-*`.
 */
export type PanelToolButtonProps = Omit<ButtonProps, 'icon' | 'label' | 'onClick' | 'ref'> & {
  ref?: Ref<HTMLButtonElement>
  [key: `data-${string}`]: string | undefined
}

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

/** A tool the panel draws itself (the details panel's watchers): always a button, never in the menu. */
export interface PanelToolElement {
  id: string
  element: ReactNode
  hidden?: boolean
}

export type PanelTool = PanelToolItem | PanelToolElement | PanelToolDivider

export interface TabbedPanelProps<S extends PanelTabSlotName> {
  /** left of the tools, at the top; without it, the tools go at the end of the tab bar */
  title?: ReactNode
  /** between the title row and the tab bar (the details panel's summary) */
  beforeTabs?: ReactNode
  /** the panel's tools, in order; items not `pinned` go in a "more" menu, where its first one is */
  tools?: PanelTool[]
  /** more props for the "more" button (its tooltip, test hooks), "More" by default */
  moreButtonProps?: PanelToolButtonProps
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
const isDivider = (tool: PanelTool): tool is PanelToolDivider => 'divider' in tool
const isMenuItem = (tool: PanelTool): tool is PanelToolItem =>
  !isElement(tool) && !isDivider(tool) && !tool.pinned

// a menu item is a list item: it takes the button props a list item has
const menuItemProps = ({ className, style, ...props }: PanelToolButtonProps = {}) => ({
  className,
  style,
  ...Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('data-'))),
})

const logError = (error: unknown) => console.error(error)

const PanelTools = ({
  tools = [],
  moreButtonProps,
  onClose,
  closeShortcut,
  onToolError = logError,
}: Pick<
  TabbedPanelProps<PanelTabSlotName>,
  'tools' | 'moreButtonProps' | 'onClose' | 'closeShortcut' | 'onToolError'
>) => {
  const shown = tools.filter((tool) => !tool.hidden)
  if (!shown.length && !onClose) return null

  // a failing tool is reported, not lost
  const run = (tool: PanelToolItem) => {
    Promise.resolve().then(tool.onClick).catch(onToolError)
  }
  const menuTools = shown.filter((tool) => isDivider(tool) || isMenuItem(tool))
  const menuItems = menuTools.map(
    (tool): MenuItemType =>
      isDivider(tool)
        ? MENU_DIVIDER
        : {
            id: tool.id,
            icon: tool.icon,
            label: tool.label,
            disabled: tool.disabled,
            danger: tool.danger,
            'data-tooltip': tool.tooltip,
            ...menuItemProps(tool.buttonProps),
            onClick: () => run(tool),
          },
  )
  const menuAt = shown.findIndex(isMenuItem)
  const menu = menuAt >= 0 && (
    <MoreMenuButton
      key="more"
      items={menuItems}
      onOpen={() => menuTools.forEach((tool) => !isDivider(tool) && tool.onPrefetch?.())}
      aria-label="More"
      data-tooltip="More"
      {...moreButtonProps}
    />
  )

  return (
    <Styled.Tools className="tabbed-panel-tools">
      {shown.map((tool, index) =>
        index === menuAt ? (
          menu
        ) : isElement(tool) ? (
          <span key={tool.id} style={{ display: 'contents' }}>
            {tool.element}
          </span>
        ) : !isDivider(tool) && tool.pinned ? (
          <Button
            key={tool.id}
            icon={tool.icon as IconType}
            variant="text"
            selected={tool.active}
            disabled={tool.disabled}
            aria-label={tool.label}
            data-tooltip={tool.tooltip ?? tool.label}
            data-shortcut={tool.shortcut}
            onMouseEnter={tool.onPrefetch}
            {...tool.buttonProps}
            onClick={() => run(tool)}
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
  moreButtonProps,
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
      moreButtonProps={moreButtonProps}
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
