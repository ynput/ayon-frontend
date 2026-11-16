// Places: where slots show, the developer panel's first choice. AYON's surfaces from the catalog
// below, one place per preview scene of the contract packages, and "Other slots" for every known
// slot without a preview. A place opens the UI around its slots, all of them at once. No React or
// package imports: unit tests import it as is.
import type { Contract, Scene } from './contractModel'
import { slotLabel } from './contractModel'

export interface PlaceSlot {
  slot: string
  /** for people, in this place */
  label: string
  description?: string
}

export interface Place {
  /** `surface` in the URL: a catalog id, a scene's `<package>:<id>`, or `other` */
  id: string
  label: string
  icon: string
  /** the heading it is listed under: AYON, or the contract package that brings it */
  source: string
  kind: 'ayon' | 'scene' | 'other'
  slots: PlaceSlot[]
  /** a scene of a contract package */
  scene?: Scene
  /** a stand-in for a surface of the AYON app: some of AYON's controls around the slots are left out */
  simplified?: boolean
  /** where an AYON place is in the app: the panel lists AYON's places under these */
  area?: AyonArea
}

/** The parts of the AYON app, in the panel's order. */
export const AYON_AREAS = ['Studio', 'Project', 'Settings', 'App'] as const
export type AyonArea = (typeof AYON_AREAS)[number]

export const OTHER_PLACE = 'other'
export const AYON_SOURCE = 'AYON'

type CatalogPlace = Omit<Place, 'source' | 'kind'>

/**
 * AYON's surfaces as the dev shell shows them, with the slots each one has, by where they are in
 * the app: the studio's pages (the header is above them), a project's pages, the settings, and
 * what runs app-wide.
 */
export const AYON_PLACES: readonly CatalogPlace[] = [
  {
    id: 'app-header',
    label: 'App header',
    icon: 'web_asset',
    area: 'Studio',
    simplified: true,
    slots: [{ slot: 'header.item', label: 'Header item' }],
  },
  {
    id: 'studio-pages',
    label: 'Studio pages',
    icon: 'home',
    area: 'Studio',
    simplified: true,
    slots: [{ slot: 'studio.page', label: 'Studio page' }],
  },
  {
    id: 'project-list',
    label: 'Project list',
    icon: 'list',
    area: 'Studio',
    slots: [{ slot: 'projectList.menuItem', label: 'Project menu item' }],
  },
  {
    id: 'project-pages',
    label: 'Project pages',
    icon: 'folder_open',
    area: 'Project',
    slots: [{ slot: 'project.page', label: 'Project page' }],
  },
  {
    id: 'slicer',
    label: 'Slicer',
    icon: 'account_tree',
    area: 'Project',
    slots: [{ slot: 'slicer.menuItem', label: 'Slicer menu item' }],
  },
  {
    id: 'project-tables',
    label: 'Project tables',
    icon: 'table',
    area: 'Project',
    simplified: true,
    slots: [
      { slot: 'tableColumn', label: 'Column' },
      { slot: 'entityMenuItem', label: 'Cell menu item' },
      { slot: 'projectTable.columnMenuItem', label: 'Column menu item' },
      { slot: 'table.shortcut', label: 'Shortcut' },
      { slot: 'projectTable.toolbarItem', label: 'Toolbar item' },
      { slot: 'projectTable.customizeSection', label: 'Customize section' },
    ],
  },
  {
    id: 'details-panel',
    label: 'Details panel',
    icon: 'dock_to_left',
    area: 'Project',
    slots: [
      { slot: 'detailsPanel.tab', label: 'Tab' },
      { slot: 'detailsPanel.menuItem', label: 'More menu item' },
    ],
  },
  {
    id: 'user-details',
    label: 'User details',
    icon: 'person',
    area: 'Settings',
    simplified: true,
    slots: [
      { slot: 'userDetails.section', label: 'Section' },
      { slot: 'userDetails.menuItem', label: 'More menu item' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: 'account_circle',
    area: 'Settings',
    simplified: true,
    slots: [{ slot: 'profile.section', label: 'Profile section' }],
  },
  {
    id: 'background',
    label: 'Background',
    icon: 'memory',
    area: 'App',
    slots: [{ slot: 'app.service', label: 'Service' }],
  },
]

/** Places renamed since: an old link's `surface` opens the place it meant. */
const RENAMED: Record<string, string> = { profile: 'account' }

/** A slot an addon declares (the addon itself, or one installed through a contract package). */
export interface DeclaredSlotInfo {
  name: string
  label?: string
  description?: string
}

/**
 * Every place: AYON's (the catalog), one per scene of the contract packages (under the package),
 * then "Other slots" with the known slots no place shows: AYON slots missing from the catalog,
 * contract slots no scene renders and the addon's own slots. A slot shared by several places is
 * in each of them; it stays one declaration.
 */
export const buildPlaces = ({
  ayonSlots,
  ayonDescriptions = {},
  contracts = [],
  declared = [],
}: {
  /** the slots of the SDK (SLOTS) */
  ayonSlots: readonly string[]
  /** where each of AYON's slots shows (SLOT_DOCS) */
  ayonDescriptions?: Readonly<Record<string, string | undefined>>
  contracts?: readonly Contract[]
  /** slots addons declare besides the contract packages' (the addon's own) */
  declared?: readonly DeclaredSlotInfo[]
}): Place[] => {
  const ayon: Place[] = AYON_PLACES.map((place) => ({
    ...place,
    source: AYON_SOURCE,
    kind: 'ayon',
    slots: place.slots
      .filter(({ slot }) => ayonSlots.includes(slot))
      .map((s) => ({ ...s, description: ayonDescriptions[s.slot] })),
  }))
  const scenes: Place[] = contracts.flatMap((contract) =>
    contract.scenes.map((scene) => ({
      id: scene.key,
      label: scene.label,
      icon: 'preview',
      source: contract.package,
      kind: 'scene' as const,
      scene,
      slots: scene.slots.flatMap((name) => {
        const slot = contract.slots.find((s) => s.name === name)
        return slot ? [{ slot: name, label: slot.label, description: slot.description }] : []
      }),
    })),
  )
  const placed = new Set([...ayon, ...scenes].flatMap((place) => place.slots.map((s) => s.slot)))
  const others: PlaceSlot[] = []
  const add = (slot: PlaceSlot) => {
    if (placed.has(slot.slot) || others.some((o) => o.slot === slot.slot)) return
    others.push(slot)
  }
  ayonSlots.forEach((slot) =>
    add({ slot, label: slotLabel(slot), description: ayonDescriptions[slot] }),
  )
  contracts.forEach((contract) =>
    contract.slots.forEach((slot) =>
      add({ slot: slot.name, label: slot.label, description: slot.description }),
    ),
  )
  declared.forEach((slot) =>
    add({ slot: slot.name, label: slotLabel(slot.name, slot.label), description: slot.description }),
  )
  const other: Place = {
    id: OTHER_PLACE,
    label: 'Other slots',
    icon: 'extension',
    source: '',
    kind: 'other',
    slots: others,
  }
  return [...ayon.filter((place) => place.slots.length), ...scenes, other]
}

/** The slots that have contributions of this addon: "used". */
export const usedSlots = (contributions: readonly { slot: string }[]) =>
  new Set(contributions.map((c) => c.slot))

/** How many distinct slots of a place this addon uses, of how many it has. */
export const placeUsage = (place: Place, used: ReadonlySet<string>) => ({
  used: new Set(place.slots.filter((s) => used.has(s.slot)).map((s) => s.slot)).size,
  total: new Set(place.slots.map((s) => s.slot)).size,
})

/** "3 of 4 used", "Unused", "1 service", "No preview": what a place's row says. */
export const placeSummary = (place: Place, used: ReadonlySet<string>, services = 0) => {
  if (place.id === 'background') return services ? `${services} service${services === 1 ? '' : 's'}` : 'Unused'
  const usage = placeUsage(place, used)
  if (place.kind === 'other') return usage.used ? `${usage.used} of ${usage.total} used` : 'No preview'
  return usage.used ? `${usage.used} of ${usage.total} used` : 'Unused'
}

/**
 * The places the panel lists: those with a slot this addon uses, or all of them with Show all; and
 * the selected one either way (an unused selection stays visible).
 */
export const listedPlaces = (
  places: readonly Place[],
  used: ReadonlySet<string>,
  showAll: boolean,
  selected?: string,
) =>
  places.filter(
    (place) =>
      place.id === selected ||
      (place.slots.length > 0 && (showAll || place.slots.some((s) => used.has(s.slot)))),
  )

/** The slots a place lists: the used ones, or all with Show all. */
export const listedSlots = (place: Place, used: ReadonlySet<string>, showAll: boolean) =>
  place.slots.filter((s) => showAll || used.has(s.slot))

/** The place a slot is shown in: the first that has it, "Other slots" when none does. */
export const placeOfSlot = (places: readonly Place[], slot: string) =>
  places.find((place) => place.kind !== 'other' && place.slots.some((s) => s.slot === slot))?.id ??
  (places.some((place) => place.slots.some((s) => s.slot === slot)) ? OTHER_PLACE : undefined)

const matches = (text: string | undefined, query: string) => !!text && text.toLowerCase().includes(query)

/**
 * The search box: a place matches by its label or its source, or by one of its slots (label,
 * name, the titles of this addon's contributions to it). Returns the places with the slots that
 * matched (all of them when the place itself did).
 */
export const searchPlaces = (
  places: readonly Place[],
  query: string,
  titles: (slot: string) => string[] = () => [],
) => {
  const q = query.trim().toLowerCase()
  if (!q) return places.map((place) => ({ place, slots: place.slots }))
  return places.flatMap((place) => {
    if (matches(place.label, q) || matches(place.source, q)) return [{ place, slots: place.slots }]
    const slots = place.slots.filter(
      (s) => matches(s.label, q) || matches(s.slot, q) || titles(s.slot).some((t) => matches(t, q)),
    )
    return slots.length ? [{ place, slots }] : []
  })
}

/**
 * What the panel lists, places with their slots. Without a search: the places with a used slot
 * and their used slots (all of them with Show all), the selected place either way. With one:
 * every place and slot the search matches, used or not (a place that matches by its name or
 * package lists all its slots).
 */
export const panelListing = (
  places: readonly Place[],
  used: ReadonlySet<string>,
  showAll: boolean,
  query: string,
  titles?: (slot: string) => string[],
  selected?: string,
) => {
  if (!query.trim())
    return listedPlaces(places, used, showAll, selected).map((place) => ({
      place,
      slots: listedSlots(place, used, showAll),
    }))
  return searchPlaces(
    places.filter((place) => place.slots.length),
    query,
    titles,
  )
}

/** A package's name for people: `@scope/ayon-addon-example-board` is "Example board". */
export const packageTitle = (source: string) => {
  const name = source.replace(/^@[^/]+\//, '').replace(/^ayon-addon-/, '').replace(/[-_]+/g, ' ').trim()
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : source
}

/**
 * Old links: `scene=<package>:<id>` (a scene), `slot=…&contribution=…` without `surface` (a
 * contribution, `ayon-addon open`), `showSlots` (the old outline toggle), `showUnused` (now
 * `showAll`), a renamed place. Returns the parameters with `surface` set from them; the rest stays.
 */
export const normalizeParams = (search: string | URLSearchParams, places: readonly Place[]) => {
  const params = new URLSearchParams(search)
  const scene = params.get('scene')
  params.delete('scene')
  params.delete('showSlots')
  const showUnused = params.get('showUnused')
  params.delete('showUnused')
  if (showUnused && !params.has('showAll')) params.set('showAll', showUnused)
  const given = params.get('surface')
  if (given && RENAMED[given]) params.set('surface', RENAMED[given])
  if (given) return params
  const slot = params.get('slot')
  const scenePlace = scene ? places.find((place) => place.id === scene) : undefined
  const surface =
    scenePlace && (!slot || scenePlace.slots.some((s) => s.slot === slot))
      ? scenePlace.id
      : slot
      ? placeOfSlot(places, slot)
      : undefined
  if (surface) params.set('surface', surface)
  return params
}

/** What a manifest snippet is built from: the slot's declaration (AYON's, or an addon's). */
export interface SnippetDeclaration {
  name: string
  version?: number
  required?: readonly string[]
  pieces?: readonly string[]
  optionalPieces?: readonly string[]
}

const pascal = (name: string) => {
  const last = name.slice(name.lastIndexOf('.') + 1)
  return last.charAt(0).toUpperCase() + last.slice(1)
}

const fieldValue = (field: string) => (field === 'icon' ? "'extension'" : "'…'")

/**
 * A manifest entry for a slot, from its declaration only: its id, required fields and pieces, and
 * which optional pieces it takes (one of them, when it has no required piece). AYON's slots use
 * their helper, others `contribute` (with `slotVersion` when the slot isn't at version 1).
 */
export const manifestSnippet = (declaration: SnippetDeclaration, helper?: string) => {
  const required = (declaration.required || []).filter((field) => field !== 'id')
  const pieces = declaration.pieces || []
  const file = `./${pascal(declaration.name)}`
  const lines = [
    "  id: 'my_contribution',",
    ...(!helper && declaration.version && declaration.version !== 1
      ? [`  slotVersion: ${declaration.version},`]
      : []),
    ...required.map((field) => `  ${field}: ${fieldValue(field)},`),
    ...pieces.map((piece) => `  ${piece}: () => import('${file}'),`),
    ...(declaration.optionalPieces?.length
      ? [
          `  // ${pieces.length ? 'optional' : 'and one of'}: ${declaration.optionalPieces.join(', ')}`,
        ]
      : []),
  ]
  return helper
    ? [`import { ${helper} } from '@ynput/ayon-addon/manifest'`, '', `${helper}({`, ...lines, '})'].join('\n')
    : [
        "import { contribute } from '@ynput/ayon-addon/manifest'",
        '',
        `contribute('${declaration.name}', {`,
        ...lines,
        '})',
      ].join('\n')
}
