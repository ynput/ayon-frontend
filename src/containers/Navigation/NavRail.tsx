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
            icon="close"
            role="button"
            aria-label="Remove divider"
            data-tooltip="Remove divider"
            onClick={() => changeDraft((draft) => removeDivider(draft, context, rowIds, id))}
          />
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

/**
 * The sidebar: the current context's places (a project's, or Home's), the selected one owning
 * the tab row, and the admin area at the bottom. Every signed-in user but guests, who only get
 * shared pages: the items follow what the user's exposure level shows.
 */
export const NavRail = () => {
  const { pathname } = useLocation()
  const user = useAppSelector((state) => state.user)
  if (user.data?.isGuest) return null

  const projectName = pathname.match(PROJECT_PATH)?.[1]
  if (projectName) return <ProjectRail projectName={decodeURIComponent(projectName)} />
  return <StudioRail />
}

export default NavRail
