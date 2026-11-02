// Key combinations of `table.shortcut` contributions: `g`, `shift+mod+c`, `alt+1`, `f2`.
// The manifest check rejects ones that don't parse or that AYON's tables use themselves; the host
// matches key events against them.

/** A parsed key combination. `mod` is ⌘ on macOS and Ctrl elsewhere. */
export interface Shortcut {
  key: string
  ctrl: boolean
  meta: boolean
  alt: boolean
  shift: boolean
  mod: boolean
}

const MODIFIERS = ['ctrl', 'meta', 'alt', 'shift', 'mod'] as const
const KEY_PATTERN =
  /^([a-z0-9]|f([1-9]|1[0-2])|up|down|left|right|enter|escape|tab|space|delete|backspace|home|end|pageup|pagedown|[,./;'[\]\\`=-])$/

/** The combination in `keys`, or `undefined` when it isn't one. */
export const parseShortcut = (keys: string): Shortcut | undefined => {
  const parts = keys.trim().toLowerCase().split('+')
  const key = parts.pop() || ''
  if (!KEY_PATTERN.test(key)) return undefined
  const shortcut: Shortcut = { key, ctrl: false, meta: false, alt: false, shift: false, mod: false }
  for (const part of parts) {
    const modifier = MODIFIERS.find((name) => name === part)
    if (!modifier || shortcut[modifier]) return undefined
    shortcut[modifier] = true
  }
  return shortcut
}

const NAVIGATION = ['up', 'down', 'left', 'right', 'enter', 'escape', 'tab', 'space']
const EDITING = ['c', 'v', 'x', 'z', 'y', 'a', 'r']
const EDITING_SHIFT = ['z', 'v', 'r']

/**
 * AYON's own table keys: moving and selecting (arrows, Enter, Escape, Tab, Space, also with
 * Shift), rename (`r`), clearing (Delete, Backspace), and with Ctrl or ⌘ copy, paste, cut, undo,
 * select all and reload, and with Shift too redo, merge paste and reload.
 */
export const isReservedShortcut = ({ key, ctrl, meta, alt, shift, mod }: Shortcut) => {
  const command = ctrl || meta || mod
  if (alt) return false
  if (!command) return NAVIGATION.includes(key) || ['r', 'delete', 'backspace'].includes(key)
  return (shift ? EDITING_SHIFT : EDITING).includes(key)
}

const isMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

// letters and digits by their place on the keyboard (e.code), so Alt and Shift don't change them
const eventKey = (event: KeyboardEvent | { key: string; code: string }) => {
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase()
  if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5)
  const key = event.key.toLowerCase()
  return key === ' ' ? 'space' : key.replace(/^arrow/, '')
}

type KeyEventLike = Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>

/** Is this key event the combination? Modifiers must match exactly. */
export const matchesShortcut = (event: KeyEventLike, shortcut: Shortcut) => {
  const mac = isMac()
  return (
    eventKey(event) === shortcut.key &&
    event.ctrlKey === (shortcut.ctrl || (shortcut.mod && !mac)) &&
    event.metaKey === (shortcut.meta || (shortcut.mod && mac)) &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift
  )
}
