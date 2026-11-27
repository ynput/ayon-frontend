import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useLocation } from 'react-router-dom'
import { Icon } from '@ynput/ayon-react-components'
import { MenuContainer } from '@shared/components'
import { useMenuContext } from '@shared/context'
import { useRestart } from '@context'
import { useAppSelector } from '@state/store'
import AppMenu from '@components/Menu/Menus/AppMenu'
import { useGetYnputConnectionsQuery } from '@queries/ynputConnect'
import {
  filterNavigation,
  findActiveItem,
  fitDocked,
  itemLandingPath,
  splitAdminItems,
  useNavAccess,
} from './filterNavigation'
import { useAdminNavigation } from './useSettingsNavigation'
import { swallowNextClick } from './arrange'
import type { NavArrangementEdit } from './NavArrangement'
import RailItem from './RailItem'
import SortableEntry from './SortableEntry'
import type { NavItem, NavLayout } from './types'
import * as Styled from './NavRail.styled'

// what the eye does on an admin page while the layout is edited
const MOVE_LABELS = { show: 'Move to the sidebar', hide: 'Move to the Admin menu' }

interface AdminDockProps {
  projectName?: string
  layout?: NavLayout
  /** the arrangement is edited: every admin page shows, the Admin menu's dimmed, with an eye */
  edit?: NavArrangementEdit
  /**
   * the height the area may take (what the sidebar's items leave): the pages that don't fit go
   * into the Admin menu, from the bottom; Infinity or not set: all stay
   */
  space?: number
}

/**
 * The sidebar's bottom, below a divider: the admin pages a layout promotes as items (Settings,
 * Projects and Events unless it says others), in its order, then the Admin menu with the other
 * admin pages and the server's actions, the top bar's old apps menu. The menu's id is the one the
 * /appMenu redirect (after signing in to Ynput Cloud) opens.
 */
const AdminDock = ({ projectName, layout, edit, space = Infinity }: AdminDockProps) => {
  const editing = !!edit
  const { pathname } = useLocation()
  const access = useNavAccess()
  const user = useAppSelector((state) => state.user)
  const { menuOpen, setMenuOpen, toggleMenuOpen } = useMenuContext()
  const { isSnoozing } = useRestart()
  const anchorRef = useRef<HTMLSpanElement>(null)

  const items = filterNavigation(useAdminNavigation(projectName), access)
  const active = findActiveItem(items, pathname)
  const { docked, folded } = splitAdminItems(items, layout)

  // loaded before the menu opens: its Ynput Cloud row or prompt is there from the first frame,
  // so the menu keeps the height it was placed with
  useGetYnputConnectionsQuery({}, { skip: !user.data?.isAdmin })

  // the pages' and the Admin button's heights while they are on the sidebar
  const dockRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState<Record<string, number>>({})
  const [buttonHeight, setButtonHeight] = useState<number>()
  const measure = () => {
    const dock = dockRef.current
    if (!dock) return
    const measured: Record<string, number> = {}
    dock.querySelectorAll<HTMLElement>('[data-rail-dock-item]').forEach((el) => {
      measured[el.dataset.railItem!] = el.offsetHeight
    })
    // only a change re-renders: this runs after every render
    if (Object.entries(measured).some(([id, height]) => heights[id] !== height))
      setHeights({ ...heights, ...measured })
    const button = dock.querySelector<HTMLElement>('[data-rail-item="admin-menu"]')
    if (button && button.offsetHeight !== buttonHeight) setButtonHeight(button.offsetHeight)
  }
  useLayoutEffect(measure)

  // the pages that don't fit go into the Admin menu, from the bottom; none while editing
  const menuShown = !!folded.length || !!user.data?.isAdmin || !!user.attrib?.developerMode
  const fit = editing
    ? docked.length
    : fitDocked({
        ids: docked.map((item) => item.id),
        heights,
        space,
        // before it has shown, the button is as high as a page
        button: buttonHeight ?? Math.max(0, ...Object.values(heights)),
        menuShown,
      })
  const onSidebar = docked.slice(0, fit)
  const inMenu = [...docked.slice(fit), ...folded]

  const isOpen = menuOpen === 'app'
  const hasMenu = !!inMenu.length || menuShown
  // the menu goes with its button (a taller window put its pages back): it doesn't reopen later;
  // and it closes when pages move in or out while it is open (the window is resized), instead of
  // staying where its old rows put it
  const placed = useRef(fit)
  useEffect(() => {
    const moved = placed.current !== fit
    placed.current = fit
    if (isOpen && (!hasMenu || moved)) setMenuOpen(false)
  }, [hasMenu, isOpen, fit, setMenuOpen])

  const renderItem = (item: NavItem, menuPage = false) => {
    const to = itemLandingPath(item, access)
    if (!to) return null
    return (
      <RailItem
        key={item.id}
        item={item}
        to={to}
        isActive={item.id === active?.id}
        compact
        data-rail-dock-item={menuPage ? undefined : ''}
        edit={
          editing
            ? {
                hidden: menuPage,
                dimmed: menuPage,
                toggle: () => edit?.togglePromoted(item.id),
                labels: MOVE_LABELS,
              }
            : undefined
        }
      />
    )
  }
  // while editing, a page on the sidebar drops in a new place there; the click that ends a drag
  // opens nothing
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const onDragEnd = ({ active: dragItem, over }: DragEndEvent) => {
    swallowNextClick()
    const id = String(dragItem.id)
    const overId = over && String(over.id)
    if (overId && overId !== id) edit?.movePromoted(id, overId)
  }

  return (
    <Styled.Dock data-rail-pinned="" data-rail-dock="" ref={dockRef}>
      <Styled.Divider />
      {editing ? (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={docked.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {docked.map((item) => (
                <SortableEntry key={item.id} id={item.id}>
                  {renderItem(item)}
                </SortableEntry>
              ))}
            </SortableContext>
          </DndContext>
          {/* the Admin menu's pages, to move to the sidebar */}
          {folded.map((item) => renderItem(item, true))}
        </>
      ) : (
        onSidebar.map((item) => renderItem(item))
      )}
      {hasMenu && (
        <>
          <Styled.MoreItem
            type="button"
            className={clsx('compact', {
              active: isOpen || inMenu.some((item) => item.id === active?.id),
            })}
            aria-label="Admin"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            data-rail-item="admin-menu"
            data-tooltip="Admin"
            data-tooltip-position="right"
            onClick={() => toggleMenuOpen('app')}
          >
            {/* not More's icon: both can show at once */}
            <Icon icon="admin_panel_settings" />
            <Styled.Label>Admin</Styled.Label>
            {isSnoozing && <Styled.NotificationDot />}
            {/* the menu opens beside the sidebar */}
            <Styled.DockAnchor ref={anchorRef} />
          </Styled.MoreItem>
          <MenuContainer id="app" target={anchorRef.current} align="left">
            <AppMenu
              user={user}
              places={inMenu.map((item) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                link: itemLandingPath(item, access),
                selected: item.id === active?.id,
              }))}
            />
          </MenuContainer>
        </>
      )}
    </Styled.Dock>
  )
}

export default AdminDock
