import type { ViewListItemModel } from '@shared/api'
import type { PinnableView } from '@shared/containers/Views'
import { PINNED_PAGES, isPinnableViewType, type LayoutSettings, type PinnedView } from './types'

/** A layout's pinned views. */
export const getPins = (layout?: LayoutSettings): PinnedView[] => layout?.project?.pinned ?? []

/** The layout with other pinned views. */
export const withPins = (
  layout: LayoutSettings | undefined,
  pinned: PinnedView[],
): LayoutSettings => ({
  ...layout,
  version: 1,
  project: { ...layout?.project, pinned },
})

/** Pins the view at the end, or unpins it when it is pinned. */
export const togglePin = (
  pins: PinnedView[],
  view: PinnableView,
  projectName?: string,
): PinnedView[] => {
  if (pins.some((pin) => pin.id === view.id)) return pins.filter((pin) => pin.id !== view.id)
  if (!isPinnableViewType(view.viewType)) return pins
  const scope = view.scope ?? 'studio'
  return [
    ...pins,
    {
      id: view.id,
      viewType: view.viewType,
      scope,
      ...(scope === 'project' && projectName ? { projectName } : {}),
    },
  ]
}

export const renamePin = (pins: PinnedView[], id: string, label: string): PinnedView[] =>
  pins.map((pin) => (pin.id === id ? { ...pin, label: label.trim() || undefined } : pin))

/** Moves a pin by `delta` places among the pins. */
export const movePin = (pins: PinnedView[], id: string, delta: number): PinnedView[] => {
  const from = pins.findIndex((pin) => pin.id === id)
  const to = from + delta
  if (from === -1 || to < 0 || to >= pins.length) return pins
  const next = [...pins]
  const [pin] = next.splice(from, 1)
  next.splice(to, 0, pin)
  return next
}

/** Points a pin at another view (after "Save as new view"), in the same place. */
export const repointPin = (pins: PinnedView[], id: string, view: PinnedView): PinnedView[] =>
  pins.map((pin) => (pin.id === id ? view : pin))

export interface VisiblePin {
  pin: PinnedView
  view: ViewListItemModel
}

/**
 * The pins the user gets a tab for in this project: views they can read (the views list holds
 * only those) and, for a project view, only in its project.
 */
export const visiblePins = (
  pins: PinnedView[],
  readable: Partial<Record<string, ViewListItemModel[]>>,
  projectName: string,
): VisiblePin[] =>
  pins.flatMap((pin) => {
    if (pin.scope === 'project' && pin.projectName !== projectName) return []
    const view = readable[pin.viewType]?.find((item) => item.id === pin.id)
    return view ? [{ pin, view }] : []
  })

/** The tab's link: the page with the view applied. */
export const pinnedViewPath = (projectName: string, pin: Pick<PinnedView, 'id' | 'viewType'>) =>
  `/projects/${projectName}/${PINNED_PAGES[pin.viewType].module}?view=${pin.id}`
