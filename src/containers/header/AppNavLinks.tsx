import { Button, Icon, Spacer } from '@ynput/ayon-react-components'
import {
  FC,
  LiHTMLAttributes,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { useSelector } from 'react-redux'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { samePageLink } from '@containers/Navigation/layouts/pins'
import { tabId } from '@containers/Navigation/layouts/applyLayout'
import { swallowNextClick, type TabRowEdit } from '@containers/Navigation/layouts/layoutEditor'
import * as Styled from './AppNavLinks.styled'
import Typography from '@/theme/typography.module.css'
import { getViewsPortalId } from '@shared/containers/Views/utils/portalUtils'
import { LegacyBadge } from '@shared/components'
import { useMenuContext, useURIContext } from '@shared/context'
import { Menu, MenuContainer } from '@shared/components'

export interface NavLinkItem {
  name?: string
  path?: string
  module?: string
  node?: ReactNode | 'spacer'
  shortcut?: string
  tooltip?: string
  accessLevels?: string[]
  enabled?: boolean
  startContent?: ReactNode
  endContent?: ReactNode
  uriSync?: boolean
  viewType?: string
  /** a saved view pinned as a tab: its id, the `view` parameter that selects this tab */
  pinnedView?: string
  deprecated?: string | boolean
  [key: string]: unknown
}

interface AppNavLinksProps {
  links?: NavLinkItem[]
  currentModule?: string
  projectName?: string
  /** while the layout is edited: the tabs it hides (in `links`, dimmed) and the eye on each tab */
  edit?: TabRowEdit
}

// a tab the user drags within the row while the layout is edited
const SortableNavItem = ({
  sortableId,
  style,
  ...props
}: LiHTMLAttributes<HTMLLIElement> & { sortableId: string; [data: string]: unknown }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: sortableId,
  })
  return (
    <Styled.NavItem
      ref={setNodeRef}
      {...props}
      {...attributes}
      {...listeners}
      style={{
        ...style,
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
      }}
    />
  )
}

const AppNavLinks: FC<AppNavLinksProps> = ({ links = [], edit }) => {
  // item = { name: 'name', path: 'path', node: node | 'spacer', accessLevel: [] }
  const navigate = useNavigate()
  const { module } = useParams<{ module?: string }>()
  const [searchParams] = useSearchParams()
  const isManager = useSelector((state: any) => state.user.data.isManager)
  const isAdmin = useSelector((state: any) => state.user.data.isAdmin)
  useURIContext()

  const access: Record<string, boolean> = {
    manager: isManager || isAdmin,
    admin: isAdmin,
  }

  //   if module is matches an item that has accessLevel that is not in access, redirect to
  useEffect(() => {
    const item = links.find((item) => item.module === `${module}`)
    if (item && item.accessLevels?.length && !item.accessLevels?.every((level) => access[level])) {
      // find the first item that this user has access
      const firstItem = links.find((item) => item.accessLevels?.every((level) => access[level]))

      if (firstItem && firstItem.path) {
        navigate(firstItem.path)
      } else {
        // last resort, navigate to home
        navigate('/')
      }
    }
  }, [module, links, access])

  // everything after the first spacer (help, menus) stays visible; tabs that don't fit fold
  const spacerIndex = links.findIndex((item) => item?.node === 'spacer')
  const tabLinks = spacerIndex === -1 ? links : links.slice(0, spacerIndex)
  const trailingLinks = spacerIndex === -1 ? [] : links.slice(spacerIndex + 1)

  const navRef = useRef<HTMLElement>(null)
  const tabsRef = useRef<HTMLUListElement>(null)
  const trailingRef = useRef<HTMLUListElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const { pathname, search } = useLocation()
  const { toggleMenuOpen } = useMenuContext()

  // a tab is open when the page is its path; a pinned view's tab when the page shows its view,
  // and then not the page's own tab
  const viewParam = searchParams.get('view')
  const pathMatches = (item?: NavLinkItem) => {
    const path = item?.path?.split('?')[0]
    return !!path && (pathname === path || pathname.startsWith(path + '/'))
  }
  const isLinkActive = (item?: NavLinkItem) => {
    if (!pathMatches(item)) return false
    if (item?.pinnedView) return item.pinnedView === viewParam
    return !(
      viewParam && tabLinks.some((link) => link?.pinnedView === viewParam && pathMatches(link))
    )
  }

  // a tab of the open page (its own or a pinned view of it) keeps the page's open list
  const linkTo = (path?: string) => path && samePageLink(path, pathname, search)

  // the tabs the user sees, by their index in tabLinks
  const shownTabs = tabLinks
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        item?.enabled !== false &&
        (!item?.accessLevels?.length || item.accessLevels.every((level) => access[level])),
    )
  const activeIndex = shownTabs.find(({ item }) => isLinkActive(item))?.index

  // each tab's width, measured while it is in the row; the row's width for tabs
  const [widths, setWidths] = useState<Record<string, number>>({})
  const [available, setAvailable] = useState(Infinity)
  const tabKey = (index: number) => `${index}:${tabLinks[index]?.path ?? tabLinks[index]?.name}`

  const measure = () => {
    const nav = navRef.current
    if (!nav) return
    const measured: Record<string, number> = {}
    tabsRef.current?.querySelectorAll<HTMLElement>(':scope > li[data-tab-index]').forEach((li) => {
      measured[tabKey(Number(li.dataset.tabIndex))] = li.offsetWidth
    })
    // only a change re-renders: this runs after every render
    if (
      Object.entries(measured).some(([key, width]) => Math.abs((widths[key] ?? -1) - width) > 0.5)
    )
      setWidths({ ...widths, ...measured })
    // the nav's padding (16) and the gaps around the trailing items
    const free = nav.clientWidth - 16 - (trailingRef.current?.offsetWidth ?? 0) - 8
    if (Math.abs(available - free) > 0.5) setAvailable(free)
  }

  useLayoutEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (navRef.current) observer.observe(navRef.current)
    // a tab grows when its page's views button moves in
    tabsRef.current?.querySelectorAll(':scope > li').forEach((li) => observer.observe(li))
    return () => observer.disconnect()
  })

  const editing = !!edit
  // tabs fold from the end into "+N"; the open tab always stays in the row
  const folded = useMemo(() => {
    const GAP = 4
    const MORE_WIDTH = 64
    // nothing folds while the layout is edited: every tab can be shown or hidden
    if (editing) return new Set<number>()
    const width = (index: number) => widths[tabKey(index)]
    if (!Number.isFinite(available) || shownTabs.some(({ index }) => width(index) === undefined))
      return new Set<number>()
    const total = shownTabs.reduce((sum, { index }) => sum + width(index) + GAP, 0)
    if (total <= available) return new Set<number>()

    const budget = available - MORE_WIDTH
    const visible: number[] = []
    let used = 0
    for (const { index } of shownTabs) {
      if (used + width(index) + GAP > budget) break
      visible.push(index)
      used += width(index) + GAP
    }
    if (activeIndex !== undefined && !visible.includes(activeIndex)) {
      used += width(activeIndex) + GAP
      while (visible.length && used > budget) used -= width(visible.pop()!) + GAP
      visible.push(activeIndex)
    }
    return new Set(shownTabs.map(({ index }) => index).filter((index) => !visible.includes(index)))
    // tabKey and shownTabs follow tabLinks, which the widths are keyed by
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widths, available, activeIndex, tabLinks, access.manager, access.admin, editing])

  const foldedTabs = shownTabs.filter(({ index }) => folded.has(index))
  const moreMenuId = 'nav-more-tabs'

  // while editing, a tab drops in a new place in the row; the click that ends a drag opens nothing
  const rowIds = shownTabs.flatMap(({ item }) => {
    const id = item.node ? undefined : tabId(item)
    return id ? [id] : []
  })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    swallowNextClick()
    if (over && active.id !== over.id) edit?.reorder(rowIds, String(active.id), String(over.id))
  }

  const renderLinks = (items: NavLinkItem[], offset = 0) =>
    items.map(
      (
        {
          accessLevels,
          node,
          shortcut,
          path,
          tooltip,
          name,
          enabled = true,
          startContent,
          endContent,
          uriSync,
          module: itemModule,
          viewType,
          pinnedView,
          deprecated,
          ...props
        }: Partial<NavLinkItem> = {},
        index,
      ) => {
        const idx = index + offset
        if (!enabled) return null
        if (offset === 0 && folded.has(index)) return null
        // if item has restrictions, check if user has access
        let hasAccess = true
        if (accessLevels?.length) {
          hasAccess = accessLevels?.every((restriction) => access[restriction])
        }
        if (!hasAccess) return null

        // return spacer if item is a spacer, or just the node
        if (node) {
          // if item is a node a spacer, return spacer
          if (node === 'spacer') {
            return <Spacer key={idx} />
          } else return <li key={idx}>{node}</li>
        }

        const active = isLinkActive({ path, pinnedView })
        // while the layout is edited, a tab of the row has an eye to hide or show it and drags
        const id = edit && offset === 0 ? tabId({ module: itemModule, pinnedView }) : undefined
        const hidden = !!id && !!edit?.hidden.includes(id)
        const itemProps = {
          'data-shortcut': shortcut,
          'data-tooltip': tooltip,
          'data-tab-index': offset === 0 ? index : undefined,
          ...props,
          className: clsx(props.className as string | undefined, {
            pinned: !!pinnedView,
            'layout-hidden': hidden,
          }),
        }
        const link = (
          <Link
            to={linkTo(path)!}
            className={active ? 'active' : undefined}
            aria-current={active ? 'page' : undefined}
            // while editing, the tab drags to a new place instead of the browser dragging its link
            draggable={id ? false : undefined}
          >
            <Button
              variant="nav"
              style={{ border: 'none' }}
              className={Typography.titleSmall}
              tabIndex={-1}
            >
              {startContent && startContent}
              <span className="tab-name" data-name={name}>
                <span className="tab-label">{name}</span>
              </span>
              {deprecated && (
                <LegacyBadge tooltip={typeof deprecated === 'string' ? deprecated : undefined} />
              )}
              {endContent && endContent}
              {viewType && <Styled.Views id={getViewsPortalId(viewType as any)} />}
              {id && (
                <Styled.TabEye
                  icon={hidden ? 'visibility_off' : 'visibility'}
                  role="button"
                  aria-label={hidden ? `Show ${name}` : `Hide ${name}`}
                  data-tooltip={hidden ? 'Show' : 'Hide'}
                  onClick={(e) => {
                    // the eye sits inside the tab's link
                    e.preventDefault()
                    e.stopPropagation()
                    edit?.toggle(id)
                  }}
                />
              )}
            </Button>
          </Link>
        )
        return id ? (
          // keyed by tab: a drop moves the tab's own element
          <SortableNavItem key={id} sortableId={id} {...itemProps}>
            {link}
          </SortableNavItem>
        ) : (
          <Styled.NavItem key={idx} {...itemProps}>
            {link}
          </Styled.NavItem>
        )
      },
    )

  return (
    <Styled.NavBar className={clsx('secondary', { editing: !!edit })} ref={navRef}>
      {edit ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={rowIds} strategy={horizontalListSortingStrategy}>
            <ul ref={tabsRef} className="tabs">
              {renderLinks(tabLinks)}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul ref={tabsRef} className="tabs">
          {renderLinks(tabLinks)}
        </ul>
      )}
      {!!foldedTabs.length && (
        <>
          <Styled.MoreTabs
            ref={moreRef}
            variant="text"
            data-tooltip="More tabs"
            onClick={() => toggleMenuOpen(moreMenuId)}
          >
            +{foldedTabs.length}
            <Icon icon="expand_more" />
          </Styled.MoreTabs>
          <MenuContainer id={moreMenuId} target={moreRef.current} align="left">
            <Menu
              menu={foldedTabs.map(({ item, index }) => ({
                id: `${index}`,
                label: item.name,
                link: linkTo(item.path),
              }))}
            />
          </MenuContainer>
        </>
      )}
      {!!trailingLinks.length && (
        <ul className="trailing" ref={trailingRef}>
          {renderLinks(trailingLinks, tabLinks.length + 1)}
        </ul>
      )}
    </Styled.NavBar>
  )
}

export default AppNavLinks
