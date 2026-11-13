export type SettingsOutlineItem = {
  /** The group's element id, which its link points to */
  id: string
  title: string
  /** 0 for a sheet, 1 for a card, 2 for a sub-group straight inside a card */
  depth: number
}

// What the outline lists: cards and the sub-groups straight inside them. Sheets have an id
// only on a page stacking several (SettingsAnchorScopeContext), and then head their cards
const OUTLINE_GROUPS = [
  '.settings-group-sheet[id]',
  '.settings-group-card',
  '.settings-group-subgroup[data-settings-depth="2"]',
].join(', ')
// a group's title row, above its content or leading its first panel
const GROUP_TITLE = [
  ':scope > .settings-group-header .settings-group-title',
  ':scope > div > .form-object-field > .settings-panel-lead > .settings-group-header .settings-group-title',
].join(', ')

// a sheet's title also holds its bundle, project and site badges (buildObjectTitle)
const TITLE_BADGES = '.settings-title-badges'

const readTitle = (title: Element) =>
  Array.from(title.childNodes)
    .filter((node) => !(node instanceof Element && node.matches(TITLE_BADGES)))
    .map((node) => node.textContent)
    .join('')
    .trim()

/**
 * Reads the outline from the rendered sheet, or every sheet inside `root`, so it follows
 * scope, search and list edits
 */
export const readSettingsOutline = (root: HTMLElement): SettingsOutlineItem[] => {
  const items: SettingsOutlineItem[] = []
  root.querySelectorAll<HTMLElement>(OUTLINE_GROUPS).forEach((group) => {
    const id = group.id
    const titleElement = group.querySelector(GROUP_TITLE)
    const title = titleElement && readTitle(titleElement)
    if (!id || !title || group.closest('[data-hidden="true"]')) return
    items.push({ id, title, depth: Number(group.dataset.settingsDepth) })
  })
  return items
}

export const isSameOutline = (a: SettingsOutlineItem[], b: SettingsOutlineItem[]) =>
  a.length === b.length &&
  a.every(
    (item, i) => item.id === b[i].id && item.title === b[i].title && item.depth === b[i].depth,
  )

/** The group an outline item links to, by its element id */
export const findSettingsGroup = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)

/** The element the sheet scrolls in, or null when that is the page itself */
export const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
  if (!node || node === document.body || node === document.documentElement) return null
  const { overflowY } = getComputedStyle(node)
  if (node.scrollHeight > node.clientHeight && !['visible', 'clip'].includes(overflowY)) {
    return node
  }
  return getScrollParent(node.parentElement)
}

/** The nearest element that scrolls its content, whether or not it overflows yet */
export const getScrollContainer = (node: HTMLElement | null): HTMLElement | null => {
  if (!node || node === document.body || node === document.documentElement) return null
  if (['auto', 'scroll'].includes(getComputedStyle(node).overflowY)) return node
  return getScrollContainer(node.parentElement)
}

// A sheet with more settings than this gets an outline even when it fits in its panel
const OUTLINE_MIN_SETTINGS = 20
// a setting's row, as drawn by SettingField (groups carry a field id too)
const SETTING_ROW = '.form-inline-field[data-fieldid]'

/**
 * Whether a sheet needs an outline: it has more than 20 settings showing, or some of
 * them are out of view, below the scroll. Settings a search hides don't count.
 */
export const isOutlineNeeded = (sheet: HTMLElement) => {
  const scroller = getScrollContainer(sheet) ?? document.scrollingElement
  if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) return true

  let count = 0
  for (const row of sheet.querySelectorAll(SETTING_ROW)) {
    if (row.closest('[data-hidden="true"]')) continue
    count += 1
    if (count > OUTLINE_MIN_SETTINGS) return true
  }
  return false
}

// How long the sheet stays fully rendered when a jump never scrolls (already in place)
const JUMP_TIMEOUT = 2000

// The jump still settling: a new one ends it first, or its timer would cut the new one short
let endPendingJump: (() => void) | null = null

/**
 * Scrolls a group to the top of the sheet. Cards off screen skip rendering and stand in
 * with an estimated height (content-visibility), and a group in a skipped card has no
 * box to scroll to (Firefox may not scroll at all). So every card renders until the scroll
 * ends: the scroll lands on the group, and each card keeps its real height afterwards.
 */
export const scrollToSettingsGroup = (sheet: HTMLElement, group: HTMLElement) => {
  endPendingJump?.()
  const scrollTarget: HTMLElement | Window = getScrollParent(sheet) ?? window
  let timer = 0
  const done = () => {
    window.clearTimeout(timer)
    scrollTarget.removeEventListener('scrollend', done)
    sheet.classList.remove('settings-sheet-measure')
    if (endPendingJump === done) endPendingJump = null
  }
  endPendingJump = done
  sheet.classList.add('settings-sheet-measure')
  group.scrollIntoView({ behavior: 'smooth', block: 'start' })
  scrollTarget.addEventListener('scrollend', done)
  timer = window.setTimeout(done, JUMP_TIMEOUT)
}
