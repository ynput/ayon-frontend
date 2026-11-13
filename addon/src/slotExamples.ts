// The example contribution of each of AYON's slots, which AYON shows with Show slots on (developer
// mode), and the code that fills in and prints any slot's example. Data only: the pieces are
// loaders, nothing here loads at startup, and scripts/generate-docs.mjs runs this file on its own in
// Node to print the examples, so it imports types only.
import type { SlotExample, SlotName } from './slots'

/** A piece that shows the slot and the context it got (`ExampleView`). */
export const exampleView = () => import('./ExampleView')
/** The same in one line, for small places: a table cell, a badge. */
export const exampleInline = () =>
  import('./ExampleView').then((module) => ({ default: module.ExampleInline }))
/** A `run` piece that only says it was used. */
export const exampleRun = () => import('./exampleRun')
// a service has no UI: its example renders nothing
const exampleService = () => Promise.resolve({ default: () => null })

const icon = 'extension'

/** AYON's example of each of its slots: every required field and piece, no filter set. */
export const SLOT_EXAMPLES: { readonly [S in SlotName]: SlotExample } = {
  'project.page': { title: 'Example page', component: exampleView },
  'studio.page': { title: 'Example page', component: exampleView },
  'header.item': { label: 'Example header item', icon, placement: 'right', run: exampleRun },
  'detailsPanel.tab': { label: 'Example tab', icon, component: exampleView },
  'detailsPanel.menuItem': { label: 'Example menu item', icon, run: exampleRun },
  'projectList.menuItem': { label: 'Example menu item', icon, run: exampleRun },
  'slicer.menuItem': { label: 'Example menu item', icon, run: exampleRun },
  entityMenuItem: { label: 'Example menu item', icon, run: exampleRun },
  'projectTable.toolbarItem': { label: 'Example', icon, run: exampleRun },
  'projectTable.columnMenuItem': { label: 'Example for {column}', icon, run: exampleRun },
  'projectTable.customizeSection': { title: 'Example section', icon, component: exampleView },
  tableColumn: { label: 'Example column', icon, cell: exampleInline },
  'table.shortcut': { label: 'Example shortcut', keys: 'alt+shift+e', run: exampleRun },
  'userDetails.section': { title: 'Example section', serviceUsers: true, component: exampleView },
  'userDetails.menuItem': { label: 'Example menu item', icon, run: exampleRun },
  'profile.section': { title: 'Example section', component: exampleView },
  'app.service': { component: exampleService },
}

/** What a slot's example is filled in from: the parts of its definition or declaration it needs. */
export interface ExampleSource {
  /** the slot's version: a manifest entry for an addon's slot at another version than 1 needs it */
  version?: number
  required: readonly string[]
  pieces: readonly string[]
  /** a declared slot's title for people */
  label?: string
  example?: SlotExample
}

/**
 * A slot's example as contribution fields, with the id `example`: what its owner wrote, plus each
 * required field it left out (the slot's label, an icon) and each required piece (`run` says it
 * was used, any other is the one-line `ExampleInline`: AYON doesn't know how big a declared slot
 * is, and the full `ExampleView` breaks a badge or a button's place). `run` is always AYON's, the
 * owner's too, so using an example changes nothing.
 */
export const exampleFields = (source: ExampleSource): Record<string, unknown> => {
  const fields: Record<string, unknown> = { id: 'example', ...source.example }
  for (const field of source.required) {
    if (typeof fields[field] !== 'string') fields[field] = field === 'icon' ? icon : source.label || 'Example'
  }
  for (const piece of source.pieces) {
    if (typeof fields[piece] !== 'function') fields[piece] = piece === 'run' ? exampleRun : exampleInline
  }
  if ('run' in fields) fields.run = exampleRun
  return fields
}

const value = (item: unknown, key: string, indent: string): string => {
  if (typeof item === 'function') return `() => import('./${key[0].toUpperCase()}${key.slice(1)}')`
  if (typeof item === 'string') return `'${item.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  if (item instanceof RegExp) return String(item)
  if (Array.isArray(item)) return `[${item.map((entry) => value(entry, key, indent)).join(', ')}]`
  if (item && typeof item === 'object') {
    const entries = Object.entries(item).map(([k, v]) => `${indent}  ${k}: ${value(v, k, `${indent}  `)},`)
    return `{\n${entries.join('\n')}\n${indent}}`
  }
  return String(item)
}

/**
 * A slot's example as a manifest entry, for the docs and `ayon-addon slots`: the slot's helper
 * when it has one (`headerItem({ ... })`), else `contribute('<slot>', { ... })`, with `slotVersion`
 * when the slot isn't at version 1 (as the dev shell's entries). Pieces show as
 * `() => import('./Piece')`.
 */
export const exampleSnippet = (slot: string, source: ExampleSource, helper?: string) => {
  const { id, ...rest } = exampleFields(source)
  const versioned = !helper && source.version !== undefined && source.version !== 1
  const fields = value({ id, ...(versioned ? { slotVersion: source.version } : {}), ...rest }, '', '')
  return helper ? `${helper}(${fields})` : `contribute('${slot}', ${fields})`
}
