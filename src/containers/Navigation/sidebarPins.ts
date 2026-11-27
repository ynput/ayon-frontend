// PROTOTYPE (navigation mix): which tab-row pages are pinned to the sidebar, one rule for the four
// groups. Pinning adds a page under its group without taking it out of the tab row.
//   Home, Project: every page pinned unless the user unpins it
//   Studio, Projects (configuration): no page pinned unless the user pins it
//   Inbox: every page pinned; Account (configuring yourself): none
// A group with no pinned pages is a plain button to its preferred page. Kept in this browser; the
// real thing would be a user preference.
import { useSyncExternalStore } from 'react'

export type PinGroup = 'home' | 'project' | 'studio' | 'projects' | 'inbox' | 'account'

/** what a group's pages are when the user changed nothing */
export const PINNED_BY_DEFAULT: Record<PinGroup, boolean> = {
  home: true,
  project: true,
  studio: false,
  projects: false,
  // personal: the Inbox's pages show (a place you work in), Account's don't (configuring yourself)
  inbox: true,
  account: false,
}

/** a page the user pinned or unpinned; a pinned one keeps what the sidebar needs to show it */
export interface PinOverride {
  pinned: boolean
  name?: string
  path?: string
}
type Overrides = Partial<Record<PinGroup, Record<string, PinOverride>>>

const KEY = 'nav-sidebar-pins'
const EVENT = 'nav-sidebar-pins-change'

let cache: { raw: string | null; value: Overrides } = { raw: null, value: {} }
const read = (): Overrides => {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // nothing pinned then
  }
  if (raw === cache.raw) return cache.value
  let value: Overrides = {}
  try {
    value = raw ? JSON.parse(raw) : {}
  } catch {
    value = {}
  }
  cache = { raw, value }
  return value
}

const write = (value: Overrides) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // not remembered then
  }
  window.dispatchEvent(new Event(EVENT))
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** the group a tab row's page belongs to, by its path */
export const pinGroupOf = (path: string): PinGroup | null => {
  if (path.startsWith('/dashboard')) return 'home'
  if (path.startsWith('/projects/')) return 'project'
  if (path.startsWith('/settings')) return 'studio'
  if (path.startsWith('/manageProjects')) return 'projects'
  if (path.startsWith('/inbox')) return 'inbox'
  if (path.startsWith('/account')) return 'account'
  return null
}

/** a tab's id for pinning: its module, else its path without the query */
export const pinIdOf = (tab: { module?: string; path?: string }) =>
  tab.module || (tab.path ?? '').split('?')[0]

export const useSidebarPins = () => {
  const overrides = useSyncExternalStore(subscribe, read, read)

  const isPinned = (group: PinGroup, id: string) =>
    overrides[group]?.[id]?.pinned ?? PINNED_BY_DEFAULT[group]

  /** the pages the user pinned in a group that pins none by default, in the order pinned */
  const pinnedPages = (group: PinGroup) =>
    Object.entries(overrides[group] ?? {})
      .filter(([, page]) => page.pinned && page.path)
      .map(([id, page]) => ({ id, name: page.name ?? id, path: page.path! }))

  const toggle = (group: PinGroup, id: string, page: { name?: string; path?: string }) => {
    const current = read()
    const pinned = !(current[group]?.[id]?.pinned ?? PINNED_BY_DEFAULT[group])
    const groupOverrides = { ...(current[group] ?? {}) }
    // back to the default: no override left
    if (pinned === PINNED_BY_DEFAULT[group]) delete groupOverrides[id]
    else
      groupOverrides[id] = {
        pinned,
        ...(pinned ? { name: page.name, path: (page.path ?? '').split('?')[0] } : {}),
      }
    write({ ...current, [group]: groupOverrides })
  }

  return { isPinned, pinnedPages, toggle }
}
