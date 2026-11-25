import type { ViewListItemModel } from '@shared/api'
import type { PinnableView, ViewSettings } from '@shared/containers/Views'
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

/**
 * Moves a pin past another one, the tab next to it: to its right when `after`, else to its left.
 * Pins in between that aren't shown here (another project's) keep their place.
 */
export const movePinPast = (
  pins: PinnedView[],
  id: string,
  otherId: string,
  after: boolean,
): PinnedView[] => {
  const pin = pins.find((item) => item.id === id)
  if (!pin || !pins.some((item) => item.id === otherId) || id === otherId) return pins
  const rest = pins.filter((item) => item.id !== id)
  const at = rest.findIndex((item) => item.id === otherId) + (after ? 1 : 0)
  return [...rest.slice(0, at), pin, ...rest.slice(at)]
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

/** The saved settings with a draft over them; a field the draft cleared is left out. */
export const applyDraft = (saved: ViewSettings, draft?: ViewSettings): ViewSettings => {
  const result: Record<string, unknown> = { ...saved }
  Object.entries(draft ?? {}).forEach(([key, value]) => {
    if (value === null) delete result[key]
    else result[key] = value
  })
  return result as ViewSettings
}
