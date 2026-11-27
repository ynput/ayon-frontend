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
import { reorderPromoted, togglePromoted } from './layouts/applyLayout'
import { changeDraft, swallowNextClick } from './layouts/layoutEditor'
import RailItem from './RailItem'
import { GroupHeader } from './GroupHeader'
import { useSidebarPins, type PinGroup } from './sidebarPins'
import SortableEntry from './SortableEntry'
import type { NavItem, NavLayout } from './types'
import * as Styled from './NavRail.styled'

// PROTOTYPE (navigation mix): the admin area's pages, in this order
const PROTOTYPE_DOCK = ['settings', 'projects', 'events', 'services', 'market']
const PROTOTYPE_LABELS: Record<string, string> = {
  settings: 'Studio',
  projects: 'Projects',
}
// the full names, on hover
const PROTOTYPE_TOOLTIPS: Record<string, string> = {
  settings: 'Studio settings',
  projects: 'Project settings',
}

// PROTOTYPE (navigation mix): below the Admin menu
const PROTOTYPE_DEV_LINKS = [
  { id: 'graphql', label: 'GraphQL', tooltip: 'GraphQL Explorer', icon: 'hub', path: '/explorer' },
  { id: 'api', label: 'REST', tooltip: 'REST API', icon: 'data_object', path: '/doc/api' },
]

// PROTOTYPE (navigation mix): the configuration items and the pin group of their tab rows
const CONFIG_PIN_GROUPS: Record<string, PinGroup> = { settings: 'studio', projects: 'projects' }

// what the eye does on an admin page while the layout is edited
const MOVE_LABELS = { show: 'Move to the sidebar', hide: 'Move to the Admin menu' }

interface AdminDockProps {
  projectName?: string
  layout?: NavLayout
  /** the layout is edited: every admin page shows, the Admin menu's dimmed, with an eye */
  editing?: boolean
  /**
   * the height the area may take (what the sidebar's items leave): the pages that don't fit go
   * into the Admin menu, from the bottom; Infinity or not set: all stay
   */
  space?: number
  /** PROTOTYPE (navigation mix): the API group's state, when the sidebar holds it */
  apiExpanded?: boolean
  setApiExpanded?: (expanded: boolean) => void
}

/**
 * The sidebar's bottom, below a divider: the admin pages a layout promotes as items (Settings,
 * Projects and Events unless it says others), in its order, then the Admin menu with the other
 * admin pages and the server's actions, the top bar's old apps menu. The menu's id is the one the
 * /appMenu redirect (after signing in to Ynput Cloud) opens.
 */
const AdminDock = ({
  projectName,
  layout: _layout,
  editing,
  space = Infinity,
  ...apiProps
}: AdminDockProps) => {
  const api = apiProps.setApiExpanded
    ? { apiExpanded: !!apiProps.apiExpanded, setApiExpanded: apiProps.setApiExpanded }
    : undefined
  const { pathname } = useLocation()
  const access = useNavAccess()
  const user = useAppSelector((state) => state.user)
  const { menuOpen, setMenuOpen } = useMenuContext()
  const { isSnoozing } = useRestart()
  const anchorRef = useRef<HTMLSpanElement>(null)
  // PROTOTYPE (navigation mix): the sidebar holds it, with Home's and the project's
  const pins = useSidebarPins()
  // the configuration group open: opens on its own pages
  const [configOpen, setConfigOpen] = useState<string | null>(null)
  useEffect(() => {
    setConfigOpen(active && CONFIG_PIN_GROUPS[active.id] ? active.id : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  const [ownApiExpanded, setOwnApiExpanded] = useState(false)
  const apiExpanded = api?.apiExpanded ?? ownApiExpanded
  const apiActive = PROTOTYPE_DEV_LINKS.some((link) => pathname.startsWith(link.path))
  const setApiExpanded = api?.setApiExpanded ?? setOwnApiExpanded
  // PROTOTYPE (navigation mix): the API group closes when anything else is picked: a click outside
  // it, or another page
  const apiRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!apiExpanded) return
    const onDown = (e: MouseEvent) => {
      if (!apiRef.current?.contains(e.target as Node)) setApiExpanded(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [apiExpanded])
  // on another page it closes; on one of its own it opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setApiExpanded(apiActive), [pathname])

  // PROTOTYPE (navigation mix): always these four pages as items, named for what they open; the
  // Admin menu has the server's actions only, no pages
  const items = filterNavigation(useAdminNavigation(projectName), access)
    .filter((item) => PROTOTYPE_DOCK.includes(item.id))
    .map((item) => ({ ...item, label: PROTOTYPE_LABELS[item.id] ?? item.label }))
  const active = findActiveItem(items, pathname)
  // PROTOTYPE (navigation mix): collapsed until opened; open while one of its pages is
  const [dockOpen, setDockOpen] = useState(false)
  const onApiPage = PROTOTYPE_DEV_LINKS.some((link) => pathname.startsWith(link.path))
  useEffect(() => {
    if (active || onApiPage) setDockOpen(true)
  }, [active?.id, onApiPage])
  const docked = PROTOTYPE_DOCK.flatMap((id) => items.filter((item) => item.id === id))
  const folded: NavItem[] = []
  void splitAdminItems

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
  const menuShown = !!user.data?.isAdmin || !!user.attrib?.developerMode
  // PROTOTYPE (navigation mix): nothing folds into the Admin menu
  const fit = docked.length
  void fitDocked({
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
    // PROTOTYPE (navigation mix): Studio and Projects pin no pages by default, so they are plain
    // buttons to their preferred page; with pages pinned from their tab rows they expand to them
    const pinGroup = CONFIG_PIN_GROUPS[item.id]
    const pinned = pinGroup && !editing ? pins.pinnedPages(pinGroup) : []
    if (pinGroup && pinned.length) {
      const expanded = configOpen === item.id
      const activePage = pinned.find(
        (page) => pathname === page.path || pathname.startsWith(`${page.path}/`),
      )
      return (
        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <GroupHeader
            icon={item.icon}
            label={item.label}
            hint={PROTOTYPE_TOOLTIPS[item.id]}
            className="compact"
            expanded={expanded}
            current={item.id === active?.id}
            onClick={() => setConfigOpen(expanded ? null : item.id)}
            onToggle={() => setConfigOpen(expanded ? null : item.id)}
          />
          {expanded && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: '2px 0',
                borderRadius: 'var(--border-radius-l)',
                background: 'var(--md-sys-color-surface-container)',
              }}
            >
              {pinned.map((page) => (
                <RailItem
                  key={page.id}
                  item={{ ...item, id: `${item.id}:${page.id}`, label: page.name, tabs: [] }}
                  to={page.path}
                  isActive={page.id === activePage?.id}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      )
    }
    return (
      <RailItem
        key={item.id}
        item={item}
        to={to}
        isActive={item.id === active?.id}
        compact
        data-rail-dock-item={menuPage ? undefined : ''}
        {...(PROTOTYPE_TOOLTIPS[item.id] ? { 'data-tooltip': PROTOTYPE_TOOLTIPS[item.id] } : {})}
        edit={
          editing
            ? {
                hidden: menuPage,
                dimmed: menuPage,
                toggle: () => changeDraft((draft) => togglePromoted(draft, item.id)),
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
    if (overId && overId !== id) changeDraft((draft) => reorderPromoted(draft, id, overId))
  }

  return (
    <Styled.Dock data-rail-pinned="" data-rail-dock="" ref={dockRef}>
      {/* PROTOTYPE (navigation mix): the admin area is collapsed behind this button; a click
          shows or hides it, a right-click opens the server's actions (the old Admin menu) */}
      <Styled.MoreItem
        type="button"
        className={clsx('compact', { active: isOpen })}
        aria-expanded={dockOpen}
        aria-label={dockOpen ? 'Hide admin' : 'Show admin'}
        aria-haspopup="menu"
        data-rail-item="admin-menu"
        data-tooltip={`${
          dockOpen ? 'Hide admin' : 'Show admin: settings, Events, Services, Market, API'
        }. Right-click: Update pipeline, Restart server, Ynput Cloud`}
        data-tooltip-position="right"
        onClick={() => setDockOpen(!dockOpen)}
        onContextMenu={(e) => {
          e.preventDefault()
          if (!hasMenu) return
          // after the click: the menu closes on a click outside it, which would be this one
          setTimeout(() => setMenuOpen(isOpen ? false : 'app'), 0)
        }}
        // stands out from the items: a soft filled pill, no border
        style={{
          minHeight: 40,
          width: 60,
          margin: '0 auto 2px',
          gap: 0,
          borderRadius: 14,
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        <Icon icon="admin_panel_settings" style={{ fontSize: 18 }} />
        <Styled.Label>Admin</Styled.Label>
        <Icon
          icon={dockOpen ? 'expand_more' : 'expand_less'}
          style={{ fontSize: 14, marginTop: -2, opacity: 0.7 }}
        />
        {isSnoozing && <Styled.NotificationDot />}
        {/* the menu opens beside the sidebar */}
        <Styled.DockAnchor ref={anchorRef} />
      </Styled.MoreItem>
      {hasMenu && (
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
      )}
      <Styled.Divider />
      {dockOpen && (
        <>
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
      {/* PROTOTYPE (navigation mix): the API explorers, below the Admin menu, as a group that
          expands in place (same exposure level as in the Help menu) */}
      {user.uiExposureLevel >= 500 && (
        <div ref={apiRef} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <GroupHeader
            icon="api"
            label="API"
            hint="GraphQL Explorer and REST API"
            className="compact"
            expanded={apiExpanded}
            // highlighted on one of its pages, like the other groups
            current={apiActive}
            onClick={() => setApiExpanded(!apiExpanded)}
            onToggle={() => setApiExpanded(!apiExpanded)}
          />
          {apiExpanded && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: '2px 0',
                borderRadius: 'var(--border-radius-l)',
                background: 'var(--md-sys-color-surface-container)',
              }}
            >
              {PROTOTYPE_DEV_LINKS.map((link) => (
                <Styled.Item
                  key={link.id}
                  to={link.path}
                  className={clsx('compact', { active: pathname.startsWith(link.path) })}
                  aria-label={link.tooltip}
                  data-rail-item={link.id}
                  data-tooltip={link.tooltip}
                  data-tooltip-position="right"
                >
                  <Icon icon={link.icon} />
                  <Styled.Label>{link.label}</Styled.Label>
                </Styled.Item>
              ))}
            </div>
          )}
        </div>
      )}
        </>
      )}
    </Styled.Dock>
  )
}

export default AdminDock
