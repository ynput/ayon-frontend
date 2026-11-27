import { useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import { getRequestErrorString } from '@shared/util'
import { useListViewsQuery } from '@shared/api'
import type { PinnableView, ViewPins } from '@shared/containers/Views'
import { useActiveLayout } from './useActiveLayout'
import { changeDraft, getLayoutEdit, useLayoutEdit } from './layoutEditor'
import { moveTabInRow, pinTabId, replaceTabId } from './applyLayout'
import { getPins, renamePin, repointPin, togglePin, visiblePins, withPins } from './pins'
import { PINNED_PAGES, type LayoutSettings, type PinnedView } from './types'

const VIEW_TYPES = Object.keys(PINNED_PAGES)

/** a tab row as the user sees it: its sidebar item, and its tabs' ids in order */
export interface TabRow {
  itemId: string
  ids: string[]
}

/**
 * The saved views pinned as tabs in a project, and the changes to them. Pins are kept in the
 * layout that applies; while a layout is edited, in its draft (saved with it, dropped on Cancel).
 * Every view type is listed once per project: the same queries the pages use, so they come from
 * the cache.
 */
export const usePinnedViews = (projectName: string) => {
  // the pins of the layout that applies here; a change may make it the user's own (see there)
  const { enabled, ready, layout, update } = useActiveLayout(projectName)
  // while a layout is edited the tabs are its draft's pins, also in a project whose own default is
  // another layout
  const edit = useLayoutEdit()
  const editing = !!edit
  const pins = getPins(edit ? edit.draft : layout)

  // one list per view type in PINNED_PAGES (hooks can't loop): a type added there needs its list here
  const has = (viewType: string) => pins.some((pin) => pin.viewType === viewType)
  const overview = useListViewsQuery(
    { viewType: 'overview', projectName },
    { skip: !enabled || !has('overview') },
  )
  const versions = useListViewsQuery(
    { viewType: 'versions', projectName },
    { skip: !enabled || !has('versions') },
  )
  const lists = useListViewsQuery(
    { viewType: 'lists', projectName },
    { skip: !enabled || !has('lists') },
  )
  const reviews = useListViewsQuery(
    { viewType: 'reviews', projectName },
    { skip: !enabled || !has('reviews') },
  )

  const visible = useMemo(
    () =>
      enabled
        ? visiblePins(
            pins,
            {
              overview: overview.currentData,
              versions: versions.currentData,
              lists: lists.currentData,
              reviews: reviews.currentData,
            },
            projectName,
          )
        : [],
    [
      enabled,
      pins,
      overview.currentData,
      versions.currentData,
      lists.currentData,
      reviews.currentData,
      projectName,
    ],
  )

  // a change goes into the draft of the layout being edited, else into the layout that applies
  const write = useCallback(
    (change: (layout: LayoutSettings | undefined) => LayoutSettings): Promise<unknown> => {
      const editing = getLayoutEdit()
      if (!editing) return update(change)
      if (editing.saving) return Promise.reject(new Error('the layout is being saved'))
      changeDraft(change)
      return Promise.resolve()
    },
    [update],
  )

  // a change to the pins: a repointed pin keeps its place in the layout's tab order, a removed one
  // (here or from the views menu) leaves it
  const change = useCallback(
    (next: (pins: PinnedView[]) => PinnedView[], repointed?: { from: string; to: string }) =>
      write((current) => {
        const before = getPins(current)
        const after = next(before)
        const changed = withPins(current, after)
        if (repointed)
          return replaceTabId(changed, pinTabId(repointed.from), pinTabId(repointed.to))
        return before
          .filter((pin) => !after.some((other) => other.id === pin.id))
          .reduce((layout, pin) => replaceTabId(layout, pinTabId(pin.id)), changed)
      }),
    [write],
  )

  // what the user does from a button or menu: a failure says so instead of failing silently
  const report = (action: Promise<unknown>) =>
    action.catch((error) => {
      toast.error(`Couldn't change your pinned tabs: ${getRequestErrorString(error)}`)
    })
  // the same, still failing for a caller that keeps its form open to try again
  const reportAndFail = (action: Promise<unknown>) =>
    action.catch((error) => {
      toast.error(`Couldn't change your pinned tabs: ${getRequestErrorString(error)}`)
      throw error
    })

  // the pin buttons wait for the layout: a pin made before it loads would be made on nothing
  const viewPins: ViewPins | null = useMemo(
    () =>
      enabled && (ready || editing)
        ? {
            viewTypes: VIEW_TYPES,
            isPinned: (viewId: string) => pins.some((pin) => pin.id === viewId),
            togglePin: (view: PinnableView) =>
              void report(change((all) => togglePin(all, view, projectName))),
          }
        : null,
    [enabled, ready, editing, pins, change, projectName],
  )

  return {
    enabled,
    visible,
    /** for the views menu's pin buttons */
    viewPins,
    // the rename dialog stays open when it fails
    rename: (id: string, label: string) =>
      reportAndFail(change((all) => renamePin(all, id, label))),
    /** moves a pinned tab one place within its row, as the user sees it */
    move: (id: string, delta: -1 | 1, row: TabRow) =>
      report(
        write((current) =>
          moveTabInRow(current, 'project', row.itemId, row.ids, pinTabId(id), delta),
        ),
      ),
    unpin: (id: string) => report(change((all) => all.filter((pin) => pin.id !== id))),
    // Save as new reports its own failure
    repoint: (id: string, view: PinnedView) =>
      change((all) => repointPin(all, id, view), { from: id, to: view.id }),
  }
}
