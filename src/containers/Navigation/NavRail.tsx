import { MouseEvent, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@ynput/ayon-react-components'
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
import { Menu, MenuContainer } from '@shared/components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { CONTEXT_MENU_TARGET_ATTR } from '@shared/containers/ContextMenu/context/context-menu/ContextMenuContextInstance'
import { useMenuContext } from '@shared/context'
import { useAppSelector } from '@state/store'
import {
  canOpenTab,
  filterNavigation,
  findActiveItem,
  isTabShown,
  itemLandingPath,
  RAIL_DIVIDER_HEIGHT,
  sortForSidebar,
  useNavAccess,
} from './filterNavigation'
import { useProjectNavigation } from './useProjectNavigation'
import { useStudioNavigation } from './useStudioNavigation'
import type { NavItem } from './types'
import {
  addDivider,
  arrangeRail,
  removeDivider,
  reorderItems,
  toggleItemHidden,
  trimDividers,
  type RailEntry,
} from './layouts/applyLayout'
import { useNavLayout, type NavLayoutState } from './layouts/useActiveLayout'
import { changeDraft, swallowNextClick } from './layouts/layoutEditor'
import AdminDock from './AdminDock'
import { GroupHeader } from './GroupHeader'
import { useGetInboxHasUnreadQuery } from '@queries/inbox/getInbox'
import { UserMenu } from '@components/Menu'
import { UserImage } from '@shared/components'
import { useSidebarPreference } from './useSidebarPreference'
import { pinIdOf, useSidebarPins } from './sidebarPins'
import { useProjectSelectDispatcher } from '@containers/ProjectMenu/hooks/useProjectSelectDispatcher'
import RailItem from './RailItem'
import SortableEntry from './SortableEntry'
import * as Styled from './NavRail.styled'

// the project path a page is on: the project rail shows there, Home's rail everywhere else
const PROJECT_PATH = /^\/projects\/([^/]+)/

interface RailProps {
  items: NavItem[]
  /**
   * pinned to the bottom, after the sections: the admin area, given the height left after every
   * item (it folds its own pages into the Admin menu first; Infinity: no limit)
   */
  footer: (space: number) => ReactNode
  /**
   * The layout that applies (`useNavLayout`): which items show, in what order, and editing it.
   * When another one applies (its id), a page it hides gives way to its first item; before it is
   * `ready`, a change isn't a switch.
   */
  nav: NavLayoutState
  /** the layout's context the rail shows */
  context: 'project' | 'studio'
  /** where the rail is (a project, or Home): a layout that applies elsewhere isn't a switch */
  scope: string
}

// what folds into More: an item's height
const MORE_HEIGHT = 54

const Rail = ({ items, footer, nav, context, scope }: RailProps) => {
  const { layout, id: layoutId, ready: layoutReady, editing, customize } = nav
  const { pathname, search } = useLocation()
  // a pinned view open on the page
  const viewId = new URLSearchParams(search).get('view')
  const navigate = useNavigate()
  const access = useNavAccess()
  const { toggleMenuOpen } = useMenuContext()
  const railRef = useRef<HTMLElement>(null)
  const moreAnchorRef = useRef<HTMLSpanElement>(null)

  // every item the user can open and the layout's dividers, where it puts them: the ones it hides
  // place too, so an item it doesn't mention lands in the same place whether they show or not
  const allEntries = useMemo(
    () => arrangeRail(sortForSidebar(filterNavigation(items, access)), layout),
    [items, access, layout],
  )
  // the items the layout shows, and the dividers that still separate some
  const shownEntries = useMemo(() => {
    const shown = new Set(filterNavigation(items, access, layout).map((item) => item.id))
    return trimDividers(allEntries.filter((entry) => !entry.item || shown.has(entry.id)))
  }, [allEntries, items, access, layout])
  const shownItems = useMemo(
    () => shownEntries.flatMap((entry) => (entry.item ? [entry.item] : [])),
    [shownEntries],
  )
  // while it is being edited, the hidden ones too (dimmed), and every divider
  const visible = editing ? allEntries : shownEntries
  const shownIds = useMemo(() => new Set(shownItems.map((item) => item.id)), [shownItems])
  const active = findActiveItem(items, pathname)

  // Switching layouts while on a page the new one hides (its item, or its tab) opens the item's
  // first shown tab, else the layout's first item. A page hidden before stays, as it was opened by
  // its link; so does a page on the first load or in another project, which aren't switches.
  const shown = useRef<{ scope: string; id?: string; path: string; page: boolean } | null>(null)
  useEffect(() => {
    if (!layoutReady) return
    const before = shown.current
    const itemShown = !!active && shownIds.has(active.id)
    const page = itemShown && !!active && isTabShown(active, pathname, layout, viewId)
    const path = `${pathname}?view=${viewId ?? ''}`
    shown.current = { scope, id: layoutId, path, page }
    if (!before || before.scope !== scope || before.id === layoutId) return
    if (!active || before.path !== path || !before.page || page) return
    const target = itemShown ? active : shownItems[0]
    const to = target && itemLandingPath(target, access, layout)
    if (to) navigate(to)
    // nowhere to go yet (its only tabs are pins still loading): tried again when the items change
    else shown.current = before
  }, [
    layoutReady,
    layoutId,
    scope,
    pathname,
    viewId,
    active,
    shownItems,
    shownIds,
    access,
    layout,
    navigate,
  ])

  // each item's height while it is on the rail, and the rail's height for the sections
  const [heights, setHeights] = useState<Record<string, number>>({})
  // the rail's height for its items and the admin area, and what the admin area leaves of it
  const [space, setSpace] = useState(Infinity)
  const [available, setAvailable] = useState(Infinity)
  const measure = () => {
    const rail = railRef.current
    if (!rail) return
    const measured: Record<string, number> = {}
    rail.querySelectorAll<HTMLElement>('[data-rail-section-item]').forEach((el) => {
      measured[el.dataset.railItem!] = el.offsetHeight
    })
    // only a change re-renders: this runs after every render
    if (Object.entries(measured).some(([id, height]) => heights[id] !== height))
      setHeights({ ...heights, ...measured })
    const pinnedHeight = [...rail.querySelectorAll<HTMLElement>('[data-rail-pinned]')].reduce(
      (sum, el) => sum + el.offsetHeight + 2,
      0,
    )
    // the rail's padding (12) and the spacer's least height (8)
    const railSpace = rail.clientHeight - 12 - 8
    if (space !== railSpace) setSpace(railSpace)
    if (available !== railSpace - pinnedHeight) setAvailable(railSpace - pinnedHeight)
  }
  useLayoutEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (railRef.current) observer.observe(railRef.current)
    return () => observer.disconnect()
  })

  // Items that don't fit fold into More, from the last one in sidebar order. The admin area gives
  // way first: it gets what every item leaves, and folds its pages into the Admin menu.
  // An entry's height and its 2px gap.
  const cost = (entry: RailEntry) => (entry.item ? heights[entry.id] ?? 0 : RAIL_DIVIDER_HEIGHT) + 2
  // nothing folds while the layout is edited: every item can be shown or hidden
  const measured =
    !editing && visible.every((entry) => !entry.item || heights[entry.id] !== undefined)
  const total = measured ? visible.reduce((sum, entry) => sum + cost(entry), 0) : 0
  // the admin area and its 2px gap
  const dockSpace = measured && Number.isFinite(space) ? space - total - 2 : Infinity
  const folded = useMemo(() => {
    if (!measured || !Number.isFinite(available) || total <= available) return new Set<string>()
    let used = MORE_HEIGHT + 2
    const fit = new Set<string>()
    for (const entry of visible) {
      if (used + cost(entry) > available) break
      fit.add(entry.id)
      used += cost(entry)
    }
    return new Set(visible.filter((entry) => !fit.has(entry.id)).map((entry) => entry.id))
    // `cost` reads `heights`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured, total, visible, heights, available])

  // what stays on the sidebar: without the folded items, nor a divider left at the end
  const onRail = useMemo(
    () => (folded.size ? trimDividers(visible.filter((entry) => !folded.has(entry.id))) : visible),
    [visible, folded],
  )
  const foldedItems = visible.flatMap((entry) =>
    entry.item && folded.has(entry.id) ? [entry.item] : [],
  )
  const moreMenuId = 'nav-rail-more'

  const renderItem = (item: NavItem) => {
    // while editing, an item whose tabs the layout hides still opens its first tab
    const to =
      itemLandingPath(item, access, layout) ?? (editing ? itemLandingPath(item, access) : undefined)
    if (!to) return null
    const railItem = (
      <RailItem
        key={item.id}
        item={item}
        to={to}
        isActive={item.id === active?.id}
        edit={
          editing
            ? {
                // the eye is the item's own flag; an item also goes when the layout hides all
                // its tabs, which only dims it
                hidden: !!layout.hidden?.includes(item.id),
                dimmed: !shownIds.has(item.id),
                toggle: () => changeDraft((draft) => toggleItemHidden(draft, context, item.id)),
              }
            : undefined
        }
        data-rail-section-item=""
      />
    )
    return editing ? (
      <SortableEntry key={item.id} id={item.id}>
        {railItem}
      </SortableEntry>
    ) : (
      railItem
    )
  }

  // while editing, a divider drags like an item and has a button that removes it
  const rowIds = visible.map((entry) => entry.id)
  const renderDivider = (id: string) =>
    editing ? (
      <SortableEntry key={id} id={id}>
        <Styled.EditDivider data-rail-divider={id}>
          <Styled.Divider />
          <Styled.DividerRemove
            type="button"
            aria-label="Remove divider"
            data-tooltip="Remove divider"
            onClick={() => changeDraft((draft) => removeDivider(draft, context, rowIds, id))}
          >
            <Icon icon="close" />
          </Styled.DividerRemove>
        </Styled.EditDivider>
      </SortableEntry>
    ) : (
      <Styled.Divider key={id} />
    )

  // while editing, an item or a divider drops anywhere on the sidebar; the click that ends a drag
  // opens nothing
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const onDragEnd = ({ active: dragItem, over }: DragEndEvent) => {
    swallowNextClick()
    const id = String(dragItem.id)
    const overId = over && String(over.id)
    if (!overId || overId === id) return
    changeDraft((draft) => reorderItems(draft, context, rowIds, id, overId))
  }
  const entries = onRail.map((entry) =>
    entry.item ? renderItem(entry.item) : renderDivider(entry.id),
  )

  // right-click: customize the layout (an item's link can still open in a new browser tab)
  const [showContextMenu, closeContextMenu] = useCreateContextMenu([])
  // The sidebar's menu closes when the page changes or the sidebar goes (Back to Home, or into a
  // review session, which hides it): its Customize is about what this sidebar showed. Only while
  // it is the sidebar's (the menu marks what it was opened on until it closes).
  const closeMenu = useRef(closeContextMenu)
  closeMenu.current = closeContextMenu
  useEffect(() => {
    const rail = railRef.current
    return () => {
      if (rail?.hasAttribute(CONTEXT_MENU_TARGET_ATTR)) closeMenu.current()
    }
  }, [pathname])
  const onContextMenu = (e: MouseEvent<HTMLElement>) => {
    if (!customize) return
    const link = (e.target as HTMLElement).closest('a')?.getAttribute('href')
    showContextMenu(e, [
      ...(link
        ? [
            {
              label: 'Open in new browser tab',
              icon: 'open_in_new',
              command: () => window.open(link, '_blank'),
            },
          ]
        : []),
      { label: 'Customize layout', icon: 'dashboard_customize', command: customize },
    ])
  }

  return (
    <Styled.Rail
      aria-label="Sidebar"
      data-nav-rail
      ref={railRef}
      className={editing ? 'editing' : undefined}
      onContextMenu={onContextMenu}
    >
      {editing ? (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              {entries}
            </SortableContext>
          </DndContext>
          <Styled.AddDivider
            type="button"
            data-tooltip="Add a divider, then drag it into place"
            data-tooltip-position="right"
            onClick={() => changeDraft((draft) => addDivider(draft, context, rowIds))}
          >
            <Icon icon="add" />
            <Styled.Label>Divider</Styled.Label>
          </Styled.AddDivider>
        </>
      ) : (
        entries
      )}
      {!!foldedItems.length && (
        <>
          <Styled.MoreItem
            type="button"
            className={folded.has(active?.id ?? '') ? 'active' : undefined}
            aria-label="More"
            data-rail-item="more"
            data-tooltip={foldedItems.map((item) => item.label).join(', ')}
            data-tooltip-position="right"
            onClick={() => toggleMenuOpen(moreMenuId)}
          >
            <Icon icon="more_horiz" />
            <Styled.Label>More ({foldedItems.length})</Styled.Label>
            {/* the menu opens beside the rail */}
            <Styled.MoreAnchor ref={moreAnchorRef} />
          </Styled.MoreItem>
          <MenuContainer id={moreMenuId} target={moreAnchorRef.current} align="left">
            <Menu
              menu={foldedItems.map((item) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                // the selected item only closes the menu, as on the rail
                ...(item.id === active?.id
                  ? { onClick: () => {} }
                  : { link: itemLandingPath(item, access, layout) }),
                selected: item.id === active?.id,
              }))}
            />
          </MenuContainer>
        </>
      )}
      <Styled.Spacer />
      {footer(dockSpace)}
    </Styled.Rail>
  )
}

const ProjectRail = ({ projectName }: { projectName: string }) => {
  const { items } = useProjectNavigation(projectName)
  const nav = useNavLayout('project', projectName)
  return (
    <Rail
      items={items}
      nav={nav}
      context="project"
      scope={projectName}
      footer={(space) => (
        <AdminDock
          projectName={projectName}
          layout={nav.layout}
          editing={nav.editing}
          space={space}
        />
      )}
    />
  )
}

const StudioRail = () => {
  const { items } = useStudioNavigation()
  const nav = useNavLayout('studio')
  return (
    <Rail
      items={items}
      nav={nav}
      context="studio"
      scope="studio"
      footer={(space) => <AdminDock layout={nav.layout} editing={nav.editing} space={space} />}
    />
  )
}

// PROTOTYPE (navigation mix): the sidebar as two groups, Home (Home's places) and Overview (the
// open project's places), each expanding in place, and the admin area at the bottom. The open
// context's group starts expanded; Overview without an open project opens the project switcher.
// No layouts and no folding into More here: it's for comparing the structure only.
// PROTOTYPE (navigation mix): a group lists its context's pages, the same as the context's tab row
// (every item's tabs, in the registry's order): the group a page is in is its scope
const TAB_ICONS: Record<string, string> = {
  overview: 'table_rows',
  tasks: 'checklist',
  browser: 'folder_open',
  products: 'layers',
  lists: 'list',
  projects: 'folder',
}

const pathOf = (path: string) => path.split('?')[0]

const useGroupItems = (items: NavItem[]) => {
  const access = useNavAccess()
  const shown = filterNavigation(items, access)
  // one entry per page the user can open (pinned views stay tabs only)
  const pages: NavItem[] = shown.flatMap((item) =>
    item.tabs
      .filter((tab) => !tab.pinnedView && tab.path && canOpenTab(tab, access))
      .map((tab) => ({
        ...item,
        id: `${item.id}:${tab.module ?? tab.path}`,
        label: tab.name ?? item.label,
        icon: (tab.module && TAB_ICONS[tab.module]) || item.icon,
        tabs: [tab],
        landing: undefined,
        match: undefined,
      })),
  )
  return { shown: pages, access }
}

const GroupItems = ({ shown }: { shown: NavItem[]; access?: ReturnType<typeof useNavAccess> }) => {
  const { pathname } = useLocation()
  // the page open: the longest tab path the URL is under
  const active = shown
    .filter((page) => {
      const path = pathOf(page.tabs[0].path!)
      return pathname === path || pathname.startsWith(`${path}/`)
    })
    .sort((a, b) => pathOf(b.tabs[0].path!).length - pathOf(a.tabs[0].path!).length)[0]
  return (
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
      {shown.map((page) => (
        <RailItem
          key={page.id}
          item={page}
          to={page.tabs[0].path!}
          isActive={page.id === active?.id}
        />
      ))}
    </div>
  )
}

interface GroupProps {
  expanded: boolean
  current: boolean
  setExpanded: (expanded: boolean) => void
}

const HomeGroup = ({ expanded, current, setExpanded }: GroupProps) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { items } = useStudioNavigation()
  const { shown: allPages, access } = useGroupItems(items)
  const pins = useSidebarPins()
  // the pages pinned to the sidebar (all, unless unpinned from the tab row)
  const shown = allPages.filter((page) => pins.isPinned('home', pinIdOf(page.tabs[0])))
  // highlighted on Home's own pages only, not on settings or the admin pages
  const onHomePage = current && !!findActiveItem(allPages, pathname)
  // nothing pinned: a plain button to Home's preferred page, Tasks
  if (!shown.length)
    return (
      <GroupHeader
        icon="home"
        label="Home"
        expanded={false}
        current={onHomePage}
        onClick={() => navigate('/dashboard/tasks')}
      />
    )
  return (
    <>
      <GroupHeader
        icon="home"
        label="Home"
        expanded={expanded}
        current={onHomePage}
        onClick={() => setExpanded(!expanded)}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && <GroupItems shown={shown} access={access} />}
    </>
  )
}
// PROTOTYPE (navigation mix): opens the project switcher from a sidebar group. It opens after the
// click: the switcher closes on a click outside it, which would be this one. A click while it is
// open only closes it (its own outside click does that).
const useProjectSwitcher = () => {
  const { menuOpen, setMenuOpen } = useMenuContext()
  const wasOpen = useRef(false)
  return {
    onMouseDown: () => {
      wasOpen.current = menuOpen === 'project'
    },
    open: () => {
      if (wasOpen.current) return
      setTimeout(() => setMenuOpen('project'), 0)
    },
  }
}

const ProjectGroup = ({
  projectName,
  expanded,
  current,
  setExpanded,
}: GroupProps & { projectName: string }) => {
  const switcher = useProjectSwitcher()
  const navigate = useNavigate()
  const [selectProject] = useProjectSelectDispatcher()
  const { items } = useProjectNavigation(projectName)
  const { shown: allPages, access } = useGroupItems(items)
  const pins = useSidebarPins()
  // the pages pinned to the sidebar (all, unless unpinned from the tab row)
  const shown = allPages.filter((page) => pins.isPinned('project', pinIdOf(page.tabs[0])))
  // nothing pinned: a plain button to the project's preferred page, Overview
  const openOverview = () => {
    if (!current) selectProject(projectName)
    navigate(`/projects/${encodeURIComponent(projectName)}/overview`)
  }
  return (
    <>
      <GroupHeader
        icon="deployed_code"
        label={projectName}
        hint={`${projectName} (right-click to switch project)`}
        expanded={expanded && !!shown.length}
        current={current}
        projectAnchor
        onClick={shown.length ? () => setExpanded(!expanded) : openOverview}
        onToggle={shown.length ? () => setExpanded(!expanded) : undefined}
        onMouseDown={switcher.onMouseDown}
        onContextMenu={switcher.open}
      />
      {expanded && !!shown.length && <GroupItems shown={shown} access={access} />}
    </>
  )
}

// PROTOTYPE (navigation mix): the last project opened, kept on the sidebar until another one is
const LAST_PROJECT_KEY = 'nav-last-project'
const useLastProject = (projectName?: string) => {
  const [last, setLast] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_PROJECT_KEY)
    } catch {
      return null
    }
  })
  useEffect(() => {
    if (!projectName) return
    setLast(projectName)
    try {
      localStorage.setItem(LAST_PROJECT_KEY, projectName)
    } catch {
      // not remembered across reloads then
    }
  }, [projectName])
  return projectName || last
}

// PROTOTYPE (navigation mix): the personal groups above the admin area, Inbox and Account, by the
// same pin rule: a group with no pinned pages is a button to its first page
const PERSONAL_GROUPS = {
  inbox: {
    label: 'Inbox',
    icon: 'inbox',
    pages: [
      { id: 'important', name: 'Important', path: '/inbox/important', icon: 'priority_high' },
      { id: 'other', name: 'Other', path: '/inbox/other', icon: 'mail' },
      { id: 'cleared', name: 'Cleared', path: '/inbox/cleared', icon: 'done_all' },
    ],
  },
  account: {
    label: 'Account',
    icon: 'account_circle',
    pages: [
      { id: 'profile', name: 'Profile', path: '/account/profile', icon: 'person' },
      { id: 'sessions', name: 'Sessions', path: '/account/sessions', icon: 'devices' },
      { id: 'downloads', name: 'Launchers', path: '/account/downloads', icon: 'download' },
    ],
  },
} as const

const PersonalGroup = ({
  group,
  expanded,
  setExpanded,
}: {
  group: keyof typeof PERSONAL_GROUPS
  expanded: boolean
  setExpanded: (expanded: boolean) => void
}) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const pins = useSidebarPins()
  const { label, icon, pages } = PERSONAL_GROUPS[group]
  const shown = pages.filter((page) => pins.isPinned(group, page.id))
  const current = pathname.startsWith(`/${group}`)
  // Inbox: the header icon's unread dot; Account: right-click opens the user menu, as the avatar
  const { data: hasUnread } = useGetInboxHasUnreadQuery({}, { skip: group !== 'inbox' })
  const user = useAppSelector((state) => state.user)
  const { menuOpen, setMenuOpen } = useMenuContext()
  const menuId = 'rail-user-menu'
  const anchorRef = useRef<HTMLSpanElement>(null)
  const openUserMenu =
    group === 'account'
      ? () => setTimeout(() => setMenuOpen(menuOpen === menuId ? false : menuId), 0)
      : undefined
  const isOn = (path: string) => pathname === path || pathname.startsWith(`${path}/`)
  return (
    <>
      <GroupHeader
        icon={icon}
        label={label}
        className="compact"
        expanded={expanded && !!shown.length}
        current={current}
        onClick={shown.length ? () => setExpanded(!expanded) : () => navigate(pages[0].path)}
        onToggle={shown.length ? () => setExpanded(!expanded) : undefined}
        dot={group === 'inbox' && !!hasUnread}
        // Account: the user's picture, as on the avatar at the top right
        iconNode={
          group === 'account' ? (
            <UserImage size={22} name={user?.name} imageKey={user?.avatarKey} />
          ) : undefined
        }
        onContextMenu={openUserMenu}
        menuAnchor={group === 'account' ? anchorRef : undefined}
        hint={group === 'account' ? 'Account (right-click for the user menu)' : undefined}
      />
      {group === 'account' && (
        <MenuContainer id={menuId} target={anchorRef.current} align="left">
          <UserMenu user={user} />
        </MenuContainer>
      )}
      {expanded && !!shown.length && (
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
          {shown.map((page) => (
            <RailItem
              key={page.id}
              item={{ id: `${group}:${page.id}`, label: page.name, icon: page.icon, section: 'other', tabs: [] }}
              to={page.path}
              isActive={isOn(page.path)}
              compact
            />
          ))}
        </div>
      )}
    </>
  )
}

const GroupedRail = ({ projectName }: { projectName?: string }) => {
  const switcher = useProjectSwitcher()
  const context = projectName ? 'project' : 'studio'
  // one group expanded at a time (or none)
  const [open, setOpen] = useState<
    'studio' | 'project' | 'api' | 'inbox' | 'account' | null
  >(context)
  // every page change, also from a shortcut or a link, opens the group that holds the page and
  // closes the others; a page no group holds (settings, the admin pages) closes them all
  const { pathname } = useLocation()
  const access = useNavAccess()
  const { items: homeItems } = useStudioNavigation()
  const onHomePage = !projectName && !!findActiveItem(filterNavigation(homeItems, access), pathname)
  const onApiPage = ['/explorer', '/doc/api'].some((path) => pathname.startsWith(path))
  useEffect(() => {
    setOpen(
      projectName
        ? 'project'
        : onHomePage
        ? 'studio'
        : onApiPage
        ? 'api'
        : pathname.startsWith('/inbox')
        ? 'inbox'
        : pathname.startsWith('/account')
        ? 'account'
        : null,
    )
    // only when the page changes, not when the user opens or closes a group
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, projectName])
  const expanded = { studio: open === 'studio', project: open === 'project' }

  const shownProject = useLastProject(projectName)

  // PROTOTYPE (navigation mix): which edges have more to scroll to
  const railRef = useRef<HTMLElement>(null)
  const [fades, setFades] = useState({ top: false, bottom: false })
  const updateFades = () => {
    const rail = railRef.current
    if (!rail) return
    const top = rail.scrollTop > 1
    const bottom = rail.scrollTop + rail.clientHeight < rail.scrollHeight - 1
    if (top !== fades.top || bottom !== fades.bottom) setFades({ top, bottom })
  }
  // after every render (a group opened or closed) and when the window resizes
  useLayoutEffect(updateFades)
  useEffect(() => {
    window.addEventListener('resize', updateFades)
    return () => window.removeEventListener('resize', updateFades)
  })
  const fadeMask =
    fades.top || fades.bottom
      ? `linear-gradient(to bottom, ${fades.top ? 'transparent 0, black 32px' : 'black 0'}, ${
          fades.bottom ? 'black calc(100% - 32px), transparent 100%' : 'black 100%'
        })`
      : undefined

  const setGroup = (group: 'studio' | 'project') => (value: boolean) =>
    setOpen(value ? group : null)

  return (
    <Styled.Rail
      aria-label="Sidebar"
      data-nav-rail
      ref={railRef}
      onScroll={updateFades}
      // scrolls when the groups are taller than the window, without a scrollbar taking the width;
      // an edge that has more beyond it fades out instead
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        // room under the header, as much as the panes have (8px)
        paddingTop: 8,
        maskImage: fadeMask,
        WebkitMaskImage: fadeMask,
      }}
    >
      <HomeGroup
        expanded={expanded.studio}
        current={context === 'studio'}
        setExpanded={setGroup('studio')}
      />
      <Styled.Divider />
      {shownProject ? (
        <ProjectGroup
          projectName={shownProject}
          expanded={expanded.project}
          current={!!projectName}
          setExpanded={setGroup('project')}
        />
      ) : (
        // no project opened yet: Project opens the project switcher
        <GroupHeader
          icon="deployed_code"
          label="Project"
          hint="Open a project"
          expanded={false}
          current={false}
          projectAnchor
          onMouseDown={switcher.onMouseDown}
          onClick={switcher.open}
          onContextMenu={switcher.open}
        />
      )}
      <Styled.Spacer />
      {/* PROTOTYPE (navigation mix): personal: Inbox and Account, above the admin area */}
      <PersonalGroup
        group="inbox"
        expanded={open === 'inbox'}
        setExpanded={(value) => setOpen(value ? 'inbox' : null)}
      />
      <PersonalGroup
        group="account"
        expanded={open === 'account'}
        setExpanded={(value) => setOpen(value ? 'account' : null)}
      />
      <AdminDock
        projectName={projectName}
        apiExpanded={open === 'api'}
        // API is one of the groups: opening it closes Home or the project; closing it opens none
        setApiExpanded={(value) =>
          setOpen((prev) => (value ? 'api' : prev === 'api' ? null : prev))
        }
      />
    </Styled.Rail>
  )
}

/**
 * The sidebar: the current context's places (a project's, or Home's), the selected one owning
 * the tab row, and the admin area at the bottom. Every signed-in user but guests, who only get
 * shared pages: the items follow what the user's exposure level shows.
 */
export const NavRail = () => {
  const { pathname } = useLocation()
  const user = useAppSelector((state) => state.user)
  // PROTOTYPE (navigation mix): the studio default, or the user's choice, can turn it off
  const { shown } = useSidebarPreference()
  if (user.data?.isGuest || !shown) return null

  const projectName = pathname.match(PROJECT_PATH)?.[1]
  // PROTOTYPE (navigation mix): the grouped sidebar instead of one context's
  return <GroupedRail projectName={projectName ? decodeURIComponent(projectName) : undefined} />
}
// the single-context sidebars, kept for switching back
void ProjectRail
void StudioRail

export default NavRail
