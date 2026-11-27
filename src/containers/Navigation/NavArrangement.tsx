import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import type { PinnableView } from '@shared/containers/Views'
import { usePowerpack, useRemoteModules } from '@shared/context'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import { useAppDispatch, type AppDispatch } from '@state/store'
import type { NavLayout } from './types'
import type { PinnedView } from './pins/types'

/**
 * The navigation can be arranged by an addon's `NavigationLayouts` module: which arrangement
 * applies, editing it and its pinned views are the module's. The navigation only shows what it
 * hands over (`arrange.ts`) and offers its controls (the eye, dragging) while it edits. Without
 * the module the navigation is as AYON lays it out, with nothing to edit.
 */

/** A sidebar entry as shown while editing, top down: in a group (its id), or not. */
export interface RailRow {
  id: string
  folder?: string
}

/** What the controls on the sidebar and the tab rows do while the arrangement is edited. */
export interface NavArrangementEdit {
  /** shows a sidebar item again, or hides it */
  toggleItem: (id: string) => void
  /** drops a sidebar item or divider (of `rowIds`, the sidebar's entries as shown) on `overId` */
  moveItem: (rowIds: string[], id: string, overId: string) => void
  /**
   * Drops a sidebar item, group or divider (of `rows`, the sidebar as shown, a group's items
   * included) before or after `overId`, or into it: an item dropped into an item makes a group of
   * the two, into a group (or one of its items) joins it. An item dragged out of its group leaves
   * it; a group left empty goes. Without it, entries only reorder (`moveItem`).
   */
  placeItem?: (rows: RailRow[], id: string, overId: string, where: 'before' | 'after' | 'into') => void
  /** names a group */
  renameFolder?: (id: string, label: string) => void
  /** puts a group's items back on the sidebar, where the group was */
  ungroup?: (id: string) => void
  /** adds a divider at the end of the sidebar, to be dragged into place */
  addDivider: (rowIds: string[]) => void
  removeDivider: (rowIds: string[], id: string) => void
  /** shows a tab of an item's row again, or hides it */
  toggleTab: (itemId: string, tabId: string) => void
  /** drops a tab of an item's row (`rowIds`, as shown) on `overId` */
  moveTab: (itemId: string, rowIds: string[], id: string, overId: string) => void
  /** moves an admin page between the sidebar and the Admin menu */
  togglePromoted: (id: string) => void
  /** drops an admin page on the sidebar where another one is */
  movePromoted: (id: string, overId: string) => void
}

/** A tab row as the user sees it: its sidebar item, and its tabs' ids in order. */
export interface TabRow {
  itemId: string
  ids: string[]
}

/** The saved views pinned as tabs, and changing them. Each change says when it failed. */
export interface NavPins {
  /** in pin order; a project view's pin shows in its project only */
  list: PinnedView[]
  /** changes can be made (they wait for the arrangement to load) */
  ready: boolean
  /** pins the view at the end, or unpins it */
  toggle: (view: PinnableView, projectName: string) => Promise<unknown>
  rename: (id: string, label: string) => Promise<unknown>
  /** moves a pinned tab one place within its row, as the user sees it */
  move: (id: string, delta: -1 | 1, row: TabRow) => Promise<unknown>
  unpin: (id: string) => Promise<unknown>
  /** points a pin at another view (after Save as new), in the same place */
  repoint: (id: string, view: PinnedView) => Promise<unknown>
}

/** The arrangement for the context on screen (the open project, or Home). */
export interface NavArrangementState {
  /** what the navigation shows (while it is edited, the edit) */
  layout: NavLayout
  /** which arrangement it is: another one applying is a switch (the rail leaves a page it hides) */
  id?: string
  /** everything that decides it has answered: before, a change isn't a switch */
  ready: boolean
  /** starts editing it; missing while that can't start */
  customize?: () => void
  /** while it is edited */
  edit?: NavArrangementEdit
  /** its pinned views */
  pins?: NavPins
}

/** What the host hands the module. */
export interface NavArrangementProviderProps {
  /** the open project, if any: the context is its, else Home's */
  projectName?: string
  /** reports the arrangement each time it changes, and `null` when the module goes */
  onChange: (state: NavArrangementState | null) => void
  /** AYON's notifications (a module's own wouldn't show) */
  toast: typeof toast
  /** the app's store, for the views dialogs */
  dispatch: AppDispatch
  /** the app's router (a module's own isn't it) */
  navigate: (to: string) => void
}

const UNARRANGED: NavArrangementState = { layout: {}, ready: false }

const NavArrangementContext = createContext<NavArrangementState>(UNARRANGED)

/** The arrangement for the context on screen; as AYON lays it out when no module arranges it. */
export const useNavArrangement = () => useContext(NavArrangementContext)

/** A tab row's controls while the arrangement is edited: what it hides, hiding, dropping. */
export interface TabRowEdit {
  hidden: string[]
  toggle: (id: string) => void
  reorder: (rowIds: string[], id: string, overId: string) => void
}

/** The controls for an item's tab row while the arrangement is edited; none otherwise. */
export const useTabRowEdit = (itemId: string): TabRowEdit | undefined => {
  const { layout, edit } = useNavArrangement()
  const hidden = layout.tabs?.[itemId]?.hidden
  return useMemo(
    () =>
      edit
        ? {
            hidden: hidden ?? [],
            toggle: (id) => edit.toggleTab(itemId, id),
            reorder: (rowIds, id, overId) => edit.moveTab(itemId, rowIds, id, overId),
          }
        : undefined,
    [edit, hidden, itemId],
  )
}

/** the open project, from the route */
const projectFromPath = (pathname: string) => {
  const match = pathname.match(/^\/projects\/([^/]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

// How the last arrangement looked (icons only, and each context's tint), so the sidebar has its
// width and colour before the module has loaded (it doesn't jump). Kept in this browser only.
const LOOK_KEY = 'nav-arrangement-look'
type Look = { iconsOnly?: boolean; tint?: Partial<Record<'project' | 'studio', string>> }
const readLook = (): Look => {
  try {
    return JSON.parse(localStorage.getItem(LOOK_KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}
const keepLook = (look: Look) => {
  try {
    localStorage.setItem(LOOK_KEY, JSON.stringify(look))
  } catch {
    // not kept: the sidebar may change once the module has loaded
  }
}

const NoModule: FC<NavArrangementProviderProps> = () => null

/**
 * Hands the navigation the arrangement from the addon's module, when there is one: in the app
 * shell, around the top bar, the sidebar and the pages. The module renders its own controls (an
 * editing panel) here too.
 */
export const NavArrangementHost = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation()
  const projectName = projectFromPath(pathname)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { powerLicense, storedLicense } = usePowerpack()
  const { modules, isLoading: isLoadingModules } = useRemoteModules()
  const provided = modules.some(
    (addon) =>
      addon.addonName === 'powerpack' && addon.modules.views?.includes('NavigationLayouts'),
  )
  const [Module] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'NavigationLayouts',
    fallback: NoModule,
    skip: !provided || !powerLicense,
  })

  const [state, setState] = useState<NavArrangementState | null>(null)
  const context = projectName ? 'project' : 'studio'
  const [look, setLook] = useState(readLook)
  useEffect(() => {
    if (!state?.ready) return
    setLook((before) => {
      const next = {
        iconsOnly: !!state.layout.iconsOnly,
        tint: { ...before.tint, [context]: state.layout.tint },
      }
      keepLook(next)
      return next
    })
  }, [state, context])

  // while the module may still come: as the last arrangement looked
  const expected = (powerLicense || !!storedLicense) && (isLoadingModules || provided)
  const value = useMemo<NavArrangementState>(
    () =>
      state ??
      (expected
        ? { layout: { iconsOnly: look.iconsOnly, tint: look.tint?.[context] }, ready: false }
        : UNARRANGED),
    [state, expected, look, context],
  )

  return (
    <NavArrangementContext.Provider value={value}>
      {children}
      {provided && powerLicense && (
        <Module
          projectName={projectName}
          onChange={setState}
          toast={toast}
          dispatch={dispatch}
          navigate={navigate}
        />
      )}
    </NavArrangementContext.Provider>
  )
}
