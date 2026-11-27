import { MouseEvent, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
} from '@dnd-kit/core'
import { SortableContext, type SortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useGetProjectQuery } from '@shared/api'
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
  arrangeRail,
  entryItems,
  isDividerId,
  isFolderId,
  isSolid,
  keepItems,
  swallowNextClick,
  trimDividers,
  type RailEntry,
} from './arrange'
import { useNavArrangement, type NavArrangementState, type RailRow } from './NavArrangement'
import AdminDock from './AdminDock'
import RailItem from './RailItem'
import RailFolder from './RailFolder'
import DropEntry, { type DropWhere } from './DropEntry'
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
   * The arrangement that applies (`useNavArrangement`): which items show, in what order, and
   * editing it. When another one applies (its id), a page it hides gives way to its first item;
   * before it is `ready`, a change isn't a switch.
   */
  nav: NavArrangementState
  /** where the rail is (a project, or Home): an arrangement that applies elsewhere isn't a switch */
  scope: string
}

// entries don't move aside while one is dragged: a copy follows the pointer, a hint shows where it
// would go (moving aside would carry the entry it is dropped into away from it)
const stayPut: SortingStrategy = () => null

// the entry level with the pointer (the sidebar is one column), else the nearest one
const underPointer: CollisionDetection = (args) => {
  const y = args.pointerCoordinates?.y
  if (y !== undefined) {
    const hit = args.droppableContainers.find((container) => {
      const rect = args.droppableRects.get(container.id)
      return !!rect && y >= rect.top && y <= rect.bottom
    })
    if (hit) return [{ id: hit.id, data: { droppableContainer: hit, value: 0 } }]
  }
  return closestCenter(args)
}

/** A group's name while editing: renamed when it loses focus (Enter), Escape keeps the old one. */
const FolderName = ({ label, onRename }: { label: string; onRename?: (label: string) => void }) => {
  const [value, setValue] = useState(label)
  useEffect(() => setValue(label), [label])
  if (!onRename) return <Styled.Label>{label}</Styled.Label>
  const commit = () => {
    const next = value.trim()
    if (next && next !== label) onRename(next)
    else setValue(label)
  }
  return (
    <input
      value={value}
      aria-label="Group name"
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      // typing in it never drags the group
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setValue(label)
          e.currentTarget.blur()
        }
      }}
    />
  )
}

// what folds into More: an item's height (icons only, an icon's)
const MORE_HEIGHT = 54
const MORE_HEIGHT_ICONS = 40

const Rail = ({ items, footer, nav, scope }: RailProps) => {
  const { layout, id: layoutId, ready: layoutReady, edit, customize } = nav
  const editing = !!edit
  const { pathname, search } = useLocation()
  // a pinned view open on the page
  const viewId = new URLSearchParams(search).get('view')
  const navigate = useNavigate()
  const access = useNavAccess()
  const { toggleMenuOpen } = useMenuContext()
  const railRef = useRef<HTMLDivElement>(null)
  const moreAnchorRef = useRef<HTMLSpanElement>(null)

  // every item the user can open and the layout's dividers, where it puts them: the ones it hides
  // place too, so an item it doesn't mention lands in the same place whether they show or not
  const allEntries = useMemo(
    () => arrangeRail(sortForSidebar(filterNavigation(items, access)), layout),
    [items, access, layout],
  )
  // the items the layout shows (in groups too; a group left empty goes), and the dividers that
  // still separate some
  const shownEntries = useMemo(() => {
    const shown = new Set(filterNavigation(items, access, layout).map((item) => item.id))
    return trimDividers(keepItems(allEntries, (item) => shown.has(item.id)))
  }, [allEntries, items, access, layout])
  const shownItems = useMemo(() => entryItems(shownEntries), [shownEntries])
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
    const target = itemShown ? active : shownItems.find((item) => !item.disabled)
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
    // the rail's padding and the spacer's least height (8)
    const railSpace = rail.clientHeight - Styled.RAIL_PADDING_BOTTOM - 8
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
  // A group is its tile: its items open over the ones below.
  const cost = (entry: RailEntry) =>
    (isSolid(entry) ? heights[entry.id] ?? 0 : RAIL_DIVIDER_HEIGHT) + 2
  // nothing folds while the layout is edited: every item can be shown or hidden
  const measured =
    !editing && visible.every((entry) => !isSolid(entry) || heights[entry.id] !== undefined)
  const total = measured ? visible.reduce((sum, entry) => sum + cost(entry), 0) : 0
  // the admin area and its 2px gap
  const dockSpace = measured && Number.isFinite(space) ? space - total - 2 : Infinity
  const folded = useMemo(() => {
    if (!measured || !Number.isFinite(available) || total <= available) return new Set<string>()
    let used = (layout.iconsOnly ? MORE_HEIGHT_ICONS : MORE_HEIGHT) + 2
    const fit = new Set<string>()
    for (const entry of visible) {
      if (used + cost(entry) > available) break
      fit.add(entry.id)
      used += cost(entry)
    }
    return new Set(visible.filter((entry) => !fit.has(entry.id)).map((entry) => entry.id))
    // `cost` reads `heights`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured, total, visible, heights, available, layout.iconsOnly])

  // what stays on the sidebar: without the folded items, nor a divider left at the end
  const onRail = useMemo(
    () => (folded.size ? trimDividers(visible.filter((entry) => !folded.has(entry.id))) : visible),
    [visible, folded],
  )
  // a folded group's items are in More one by one
  const foldedItems = entryItems(visible.filter((entry) => folded.has(entry.id)))
  const moreMenuId = 'nav-rail-more'

  const renderItem = (item: NavItem) => {
    // while editing, an item whose tabs the layout hides still opens its first tab
    const to =
      itemLandingPath(item, access, layout) ?? (editing ? itemLandingPath(item, access) : undefined)
    // a disabled item opens nothing but shows
    if (!to && !item.disabled) return null
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
                toggle: () => edit?.toggleItem(item.id),
              }
            : undefined
        }
        data-rail-section-item=""
      />
    )
    return editing ? (
      <DropEntry key={item.id} id={item.id} drop={dropAt(item.id)}>
        {railItem}
      </DropEntry>
    ) : (
      railItem
    )
  }

  // while editing, a divider drags like an item and has a button that removes it
  const rowIds = visible.map((entry) => entry.id)
  const renderDivider = (id: string) =>
    editing ? (
      <DropEntry key={id} id={id} drop={dropAt(id)}>
        <Styled.EditDivider data-rail-divider={id}>
          <Styled.Divider />
          <Styled.DividerRemove
            type="button"
            aria-label="Remove divider"
            data-tooltip="Remove divider"
            onClick={() => edit?.removeDivider(rowIds, id)}
          >
            <Icon icon="close" />
          </Styled.DividerRemove>
        </Styled.EditDivider>
      </DropEntry>
    ) : (
      <Styled.Divider key={id} />
    )

  // a group: its tile, or while editing, open in place with its name and Ungroup on top
  const renderFolder = (entry: RailEntry & { folder: NonNullable<RailEntry['folder']> }) =>
    editing ? (
      <Styled.EditFolder key={entry.id}>
        <DropEntry id={entry.id} drop={dropAt(entry.id)}>
          <Styled.FolderHeader data-rail-item={entry.id}>
            <Icon icon="folder" />
            <FolderName
              label={entry.folder.label}
              onRename={edit?.renameFolder && ((label) => edit.renameFolder?.(entry.id, label))}
            />
            {edit?.ungroup && (
              <button
                type="button"
                aria-label="Ungroup"
                data-tooltip="Ungroup: its items back on the sidebar"
                onClick={() => edit.ungroup?.(entry.id)}
              >
                <Icon icon="folder_off" />
              </button>
            )}
          </Styled.FolderHeader>
        </DropEntry>
        {entry.folder.items.map(renderItem)}
      </Styled.EditFolder>
    ) : (
      <RailFolder key={entry.id} entry={entry} activeId={active?.id} renderItem={renderItem} />
    )

  // While editing, an item, a group or a divider drops anywhere on the sidebar: nothing moves
  // aside, a line shows where it goes, a ring that an item goes into another (a group of the two)
  // or into a group. The click that ends a drag opens nothing.
  const rows: RailRow[] = visible.flatMap((entry) =>
    entry.folder
      ? [{ id: entry.id }, ...entry.folder.items.map((item) => ({ id: item.id, folder: entry.id }))]
      : [{ id: entry.id }],
  )
  const [drop, setDrop] = useState<{ overId: string; where: DropWhere } | null>(null)
  const dropAt = (id: string) => (drop?.overId === id ? drop.where : undefined)
  const [dragged, setDragged] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const dropFor = ({ active: drag, over, activatorEvent, delta }: DragMoveEvent): typeof drop => {
    const id = String(drag.id)
    const overId = over ? String(over.id) : null
    if (!over || !overId || overId === id) return null
    // a group doesn't go into itself
    if (rows.find((row) => row.id === overId)?.folder === id) return null
    // where the pointer is on the entry: its top, its middle or its bottom
    const pointerY = (activatorEvent as PointerEvent).clientY + delta.y
    const ratio = (pointerY - over.rect.top) / over.rect.height
    const isItem = (row: string) => !isDividerId(row) && !isFolderId(row)
    // an item goes into a group's header, and into an item's middle
    const into =
      !!edit?.placeItem &&
      isItem(id) &&
      !isDividerId(overId) &&
      (isFolderId(overId) || (ratio > 0.3 && ratio < 0.7))
    if (into) return { overId, where: 'into' }
    return { overId, where: ratio < 0.5 ? 'before' : 'after' }
  }
  const onDragMove = (event: DragMoveEvent) => {
    const next = dropFor(event)
    if (next?.overId !== drop?.overId || next?.where !== drop?.where) setDrop(next)
  }
  const onDragEnd = ({ active: drag }: DragEndEvent) => {
    swallowNextClick()
    const target = drop
    setDrop(null)
    setDragged(null)
    if (!target || !edit) return
    const id = String(drag.id)
    if (edit.placeItem) edit.placeItem(rows, id, target.overId, target.where)
    else edit.moveItem(rowIds, id, target.overId)
  }
  const draggedEntry: RailEntry | undefined = dragged
    ? visible.find((entry) => entry.id === dragged) ??
      visible
        .flatMap((entry) => entry.folder?.items ?? [])
        .filter((item) => item.id === dragged)
        .map((item) => ({ id: item.id, item }))[0]
    : undefined
  const entries = onRail.map((entry) =>
    entry.item
      ? renderItem(entry.item)
      : entry.folder
      ? renderFolder({ ...entry, folder: entry.folder })
      : renderDivider(entry.id),
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
      ref={railRef}
      className={editing ? 'editing' : undefined}
      onContextMenu={onContextMenu}
    >
      {editing ? (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={underPointer}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={({ active: drag }) => setDragged(String(drag.id))}
            // a move reports the target it had before the move; a change of target, the new one
            onDragMove={onDragMove}
            onDragOver={onDragMove}
            onDragEnd={onDragEnd}
            onDragCancel={() => {
              setDrop(null)
              setDragged(null)
            }}
          >
            <SortableContext items={rows.map((row) => row.id)} strategy={stayPut}>
              {entries}
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {draggedEntry && (
                <Styled.DragChip>
                  <Icon
                    icon={
                      draggedEntry.item?.icon ??
                      (draggedEntry.folder ? 'folder' : 'horizontal_rule')
                    }
                  />
                  <Styled.Label>
                    {draggedEntry.item?.label ?? draggedEntry.folder?.label ?? 'Divider'}
                  </Styled.Label>
                </Styled.DragChip>
              )}
            </DragOverlay>
          </DndContext>
          <Styled.AddDivider
            type="button"
            data-tooltip="Add a divider, then drag it into place"
            data-tooltip-position="right"
            onClick={() => edit?.addDivider(rowIds)}
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
                ...(item.disabled
                  ? { disabled: true }
                  : item.id === active?.id
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

const ProjectRail = ({ projectName, nav }: { projectName: string; nav: NavArrangementState }) => {
  const { items } = useProjectNavigation(projectName)
  return (
    <Rail
      items={items}
      nav={nav}
      scope={projectName}
      footer={(space) => (
        <AdminDock projectName={projectName} layout={nav.layout} edit={nav.edit} space={space} />
      )}
    />
  )
}

const StudioRail = ({ nav }: { nav: NavArrangementState }) => {
  const { items } = useStudioNavigation()
  return (
    <Rail
      items={items}
      nav={nav}
      scope="studio"
      footer={(space) => <AdminDock layout={nav.layout} edit={nav.edit} space={space} />}
    />
  )
}

/**
 * The sidebar: Home, then the current context's places (a project's, or Home's), the selected one
 * owning the tab row, and the admin area at the bottom. Home stays put across contexts, outside
 * their rails. Every signed-in user but guests, who only get shared pages: the items follow what
 * the user's exposure level shows.
 */
export const NavRail = () => {
  const user = useAppSelector((state) => state.user)
  if (user.data?.isGuest) return null
  return <Sidebar />
}

// as a project's colour is stored (`#rgb` or `#rrggbb`)
const HEX_COLOUR = /^#(?:[0-9a-f]{3}){1,2}$/i

const Sidebar = () => {
  const { pathname } = useLocation()
  const projectName = pathname.match(PROJECT_PATH)?.[1]
  const project = projectName ? decodeURIComponent(projectName) : undefined
  // the arrangement that applies here: the context's places, and whether the sidebar shows icons
  // only
  const nav = useNavArrangement()
  // the context's colour on the selection: the project's own (its data), else the arrangement's.
  // Only a colour: both are shared, so nothing else goes into the style. The open project's only
  // (`currentData`), so the last one's doesn't linger while another loads
  const { currentData: projectData } = useGetProjectQuery(
    { projectName: project ?? '' },
    { skip: !project },
  )
  const tint = [project ? projectData?.data?.color : undefined, nav.layout.tint].find(
    (colour): colour is string => typeof colour === 'string' && HEX_COLOUR.test(colour),
  )

  return (
    <Styled.Column
      aria-label="Sidebar"
      data-nav-rail
      className={clsx({ 'icons-only': nav.layout.iconsOnly, tinted: !!tint })}
      style={tint ? ({ '--rail-tint': tint } as CSSProperties) : undefined}
    >
      {/* Home is the context of every page outside a project */}
      <Styled.HomeItem
        to="/dashboard/tasks"
        id="home-button"
        className={clsx({ here: !projectName })}
        data-tooltip="Home"
        data-tooltip-position="right"
      >
        <Icon icon="home" />
        <Styled.Label>Home</Styled.Label>
      </Styled.HomeItem>
      <Styled.Divider />
      {project ? <ProjectRail projectName={project} nav={nav} /> : <StudioRail nav={nav} />}
    </Styled.Column>
  )
}

export default NavRail
