import { MouseEvent, ReactNode } from 'react'
import clsx from 'clsx'
import { SettingsGroupDepthContext, useSettingsGroupDepth } from './SettingsGroupContextInstance'
import {
  SettingsListItemContext,
  SettingsListItemState,
  useSettingsListItem,
} from './SettingsListItemContextInstance'
import { getSettingsGroupAnchor, getSettingsGroupLayout, toTitleCase } from './SettingsGroupHelpers'
import * as Styled from './SettingsGroup.styled'

export type SettingsGroupProps = {
  objId?: string
  title?: ReactNode
  description?: string
  enabledToggler?: ReactNode
  /** Controls at the end of the title row, before the switch (a list's colour scheme) */
  headerExtra?: ReactNode
  className?: string
  /** The form root: drawn as the sheet title, its children become cards */
  isRoot?: boolean
  /** A list (array): its items are boxes already, so its content never sits in a panel */
  isList?: boolean
  onClick?: () => void
  onContextMenu?: (e: MouseEvent) => void
  /** As a function, it gets the title row when a section leads its first panel with it */
  children?: ReactNode | ((lead: ReactNode) => ReactNode)
}

type SettingsGroupHeaderProps = Pick<
  SettingsGroupProps,
  'title' | 'description' | 'enabledToggler' | 'headerExtra' | 'onClick' | 'onContextMenu'
> & {
  listItem: SettingsListItemState | null
}

/** A group's title row: fold chevron (list items), title, actions, "enabled" switch */
const SettingsGroupHeader = ({
  title,
  description,
  enabledToggler,
  headerExtra,
  onClick,
  onContextMenu,
  listItem,
}: SettingsGroupHeaderProps) => {
  const onHeaderClick = (e: MouseEvent) => {
    onClick?.()
    // the item's own switch and buttons act on their own, they don't fold it
    if (!listItem || listItem.empty || (e.target as HTMLElement).closest('button, input, label'))
      return
    listItem.onToggle()
  }

  // like the classic panels' description: dimmed, at the end of the title row
  const summary = !!listItem && !listItem.expanded && listItem.summary

  return (
    <Styled.Header
      className={clsx('settings-group-header', listItem?.empty && 'is-empty')}
      onClick={onHeaderClick}
      onContextMenu={onContextMenu}
    >
      {listItem && (
        <Styled.FoldButton
          className="settings-group-fold"
          variant="text"
          icon={listItem.expanded ? 'expand_more' : 'chevron_right'}
          disabled={listItem.empty}
          aria-expanded={listItem.expanded}
          aria-label={listItem.expanded ? 'Fold item' : 'Open item'}
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
            listItem.onToggle()
          }}
        />
      )}
      <Styled.Title
        className="settings-group-title"
        data-tooltip={description || undefined}
        data-tooltip-as="markdown"
        data-tooltip-delay={300}
      >
        {title}
      </Styled.Title>
      {summary && <Styled.Summary className="settings-group-summary">{summary}</Styled.Summary>}
      {onContextMenu && (
        <Styled.ActionsButton
          className="settings-group-actions"
          variant="text"
          icon="more_horiz"
          aria-label="Copy, paste and override actions"
          data-tooltip="Copy, paste and override actions"
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
            onContextMenu(e)
          }}
        />
      )}
      {headerExtra}
      {enabledToggler && (
        <Styled.HeaderToggle className="settings-group-toggle">
          {enabledToggler}
        </Styled.HeaderToggle>
      )}
    </Styled.Header>
  )
}

type SettingsGroupBodyProps = {
  body: 'none' | 'card' | 'plain'
  isList?: boolean
  children: ReactNode
}

// A group's content. A card's fields sit in panels its form template makes; a list
// card has only its items, which share one panel
const SettingsGroupBody = ({ body, isList, children }: SettingsGroupBodyProps) => {
  if (body === 'none') return null
  if (body === 'plain') return <>{children}</>
  return (
    <Styled.Body className="settings-group-body">
      {isList ? <div className="settings-panel">{children}</div> : children}
    </Styled.Body>
  )
}

/**
 * A group of settings in the flat layout. Takes the same props as the classic
 * SettingsPanel, so form templates can swap one for the other. What it draws
 * depends on how deep it sits:
 * - the root is the sheet title
 * - top-level groups (cards) have their title on the sheet, above their panels
 * - deeper groups (sections) have their title above the inset panels holding their
 *   fields; one with an "enabled" switch makes it the first row of its first panel
 * The "enabled" switch sits at the end of its title row, like every other switch.
 * A list item that folds (see ArrayFieldItemTemplate) gets a chevron, and while folded
 * shows only its title and a summary of its values.
 */
export const SettingsGroup = ({
  objId,
  title,
  description,
  enabledToggler,
  headerExtra,
  className,
  isRoot,
  isList,
  onClick,
  onContextMenu,
  children,
}: SettingsGroupProps) => {
  const listItem = useSettingsListItem()
  const { depth, variant, folded, isSection, leadsPanel, hasHeader, body } = getSettingsGroupLayout(
    {
      parentDepth: useSettingsGroupDepth(),
      isRoot,
      isList,
      hasTitle: !!title,
      hasSwitch: !!enabledToggler,
      listItem,
    },
  )

  const header = hasHeader && (
    <SettingsGroupHeader
      title={isSection && typeof title === 'string' ? toTitleCase(title) : title}
      description={description}
      enabledToggler={enabledToggler}
      headerExtra={headerExtra}
      onClick={onClick}
      onContextMenu={onContextMenu}
      listItem={listItem}
    />
  )

  // the title row goes in the first panel only when the content takes it
  const headerInPanel = leadsPanel && typeof children === 'function'
  const inner = typeof children === 'function' ? children(headerInPanel ? header : null) : children

  const anchor = objId && !isRoot ? getSettingsGroupAnchor(objId) : undefined

  return (
    <SettingsGroupDepthContext.Provider value={depth}>
      <Styled.Group
        className={clsx(
          'settings-group',
          `settings-group-${variant}`,
          listItem && 'settings-group-foldable',
          folded && 'settings-group-folded',
          headerInPanel && 'settings-group-leads-panel',
          className,
        )}
        id={anchor}
        data-fieldid={objId}
        data-settings-depth={depth}
      >
        {!headerInPanel && header}
        {/* groups inside a list item are not the item: they never fold with it */}
        <SettingsListItemContext.Provider value={null}>
          <SettingsGroupBody body={body} isList={isList}>
            {inner}
          </SettingsGroupBody>
        </SettingsListItemContext.Provider>
      </Styled.Group>
    </SettingsGroupDepthContext.Provider>
  )
}
