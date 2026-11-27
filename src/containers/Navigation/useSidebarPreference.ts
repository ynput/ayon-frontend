// PROTOTYPE (navigation mix): whether the sidebar shows. The studio sets the default for everyone,
// each user can override it. In the prototype the studio default is a constant and the user's
// choice lives in this browser; the real thing would be a server setting and a user preference.
import { useSyncExternalStore } from 'react'

export type SidebarChoice = 'on' | 'off' | 'studio'

/** the studio's default, a server setting in the real thing */
export const STUDIO_SIDEBAR_DEFAULT = true

const KEY = 'nav-sidebar'
const EVENT = 'nav-sidebar-change'

const read = (): SidebarChoice => {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'on' || value === 'off' ? value : 'studio'
  } catch {
    return 'studio'
  }
}

export const setSidebarChoice = (choice: SidebarChoice) => {
  try {
    if (choice === 'studio') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, choice)
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

/** the user's choice, and whether the sidebar shows */
export const useSidebarPreference = () => {
  const choice = useSyncExternalStore(subscribe, read, read)
  const shown = choice === 'studio' ? STUDIO_SIDEBAR_DEFAULT : choice === 'on'
  return { choice, shown }
}
