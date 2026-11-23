import type { TraitDefinition, TraitDefinitions } from '@shared/api'
import { parseTraitId, ParsedTraitId } from './parseTraitId'
import { isPlainObject } from './isPlainObject'
import { getFileLayout } from './traitFields'

export type TraitViewKind = 'widget' | 'schema' | 'raw'

/** One way of showing a trait. A trait can have several, the user switches between them. */
export type TraitWidgetEntry<C = unknown> = {
  // unique within the trait, used to remember the choice (e.g. `strip`, `table`)
  id: string
  label: string
  // material icon of the view switcher
  icon: string
  component: C
  // trait versions the view can show, all versions when not set
  versions?: number[]
}

// keyed by versionless trait id, or by the widget name a definition asks for in `ui.widget`.
// Views are listed in order of preference, the first one is the default.
export type TraitWidgetRegistry<C = unknown> = Record<string, TraitWidgetEntry<C>[]>

export type TraitView = {
  // `schema` and `raw` for the built-in views, the entry id for widgets
  id: string
  kind: TraitViewKind
  label: string
  icon: string
  // registry key of a widget view
  widget?: string
}

export const SCHEMA_VIEW: TraitView = {
  id: 'schema',
  kind: 'schema',
  label: 'Fields',
  icon: 'list_alt',
}
export const RAW_VIEW: TraitView = {
  id: 'raw',
  kind: 'raw',
  label: 'Stored values',
  icon: 'data_object',
}

export type TraitItem = {
  id: string
  parsed: ParsedTraitId
  data: unknown
  definition?: TraitDefinition
  // views the trait can be shown with, the default first
  views: TraitView[]
  label: string
  group: string
  // versions of the same trait that have a definition, when this version has none
  definedVersions: number[]
}

export type TraitGroup = { label: string; items: TraitItem[] }

const GROUP_LABELS: Record<string, string> = {
  'ayon.content': 'Content',
  'ayon.time': 'Time',
  'ayon.2d': '2D',
  'ayon.3d': '3D',
  'ayon.color': 'Color',
  'ayon.meta': 'Meta',
  'ayon.lifecycle': 'Lifecycle',
  'ayon.cryptography': 'Cryptography',
}
const GROUP_ORDER = Object.values(GROUP_LABELS)

export { isPlainObject }

/** True when a representation `traits` value has at least one trait. */
export const hasTraits = (value: unknown): value is Record<string, unknown> =>
  isPlainObject(value) && Object.keys(value).length > 0

/** False for traits that store nothing (marker traits like Image), which start collapsed. */
export const hasTraitValues = (data: unknown): boolean =>
  data !== null && data !== undefined && !(isPlainObject(data) && !Object.keys(data).length)

// registry keys of the file views, shared by the file traits (see FILE_TRAIT_LAYOUTS)
export const FILE_LIST_VIEWS = 'files:list'
export const SINGLE_FILE_VIEWS = 'files:single'

/** Registry key of the file views of a trait: `files:list` for a list of files, `files:single` for one. */
export const getFileViewKey = (traitId: string): string | null => {
  const layout = getFileLayout(traitId)
  if (!layout) return null
  return layout.items ? FILE_LIST_VIEWS : SINGLE_FILE_VIEWS
}

const supportsVersion = (entry: TraitWidgetEntry, version: number | null) =>
  !entry.versions || (version !== null && entry.versions.includes(version))

/**
 * Lists the views a trait can be shown with, in order of preference:
 * 1. widgets named by `ui.widget` of the definition
 * 2. file views, for traits whose file layout the views know (`files:list`, `files:single`)
 * 3. widgets registered for the versionless id that support the version
 * 4. the schema-driven view, when the exact version has a definition
 * 5. the stored values, always
 */
export const resolveTraitViews = (
  parsed: ParsedTraitId,
  definition: TraitDefinition | undefined,
  registry: TraitWidgetRegistry,
): TraitView[] => {
  const views: TraitView[] = []
  const seen = new Set<string>([SCHEMA_VIEW.id, RAW_VIEW.id])

  const uiWidget = definition?.ui?.widget
  const keys = [
    typeof uiWidget === 'string' ? uiWidget : null,
    getFileViewKey(parsed.id),
    parsed.versionlessId,
  ]
  for (const key of keys) {
    if (!key) continue
    for (const entry of registry[key] || []) {
      if (seen.has(entry.id) || !supportsVersion(entry, parsed.version)) continue
      seen.add(entry.id)
      views.push({
        id: entry.id,
        kind: 'widget',
        label: entry.label,
        icon: entry.icon,
        widget: key,
      })
    }
  }

  if (definition?.schema) views.push(SCHEMA_VIEW)
  views.push(RAW_VIEW)
  return views
}

/** The view the user picked for the trait when it is still available, the default otherwise. */
export const pickTraitView = (views: TraitView[], preferred: string | undefined): TraitView =>
  views.find((view) => view.id === preferred) || views[0]

const getGroupLabel = (parsed: ParsedTraitId, definition?: TraitDefinition): string => {
  const uiGroup = definition?.ui?.group
  if (typeof uiGroup === 'string' && uiGroup) return uiGroup
  return GROUP_LABELS[parsed.namespace] || parsed.namespace || 'Other'
}

export const buildTraitItems = (
  traits: Record<string, unknown>,
  definitions: TraitDefinitions,
  registry: TraitWidgetRegistry,
): TraitItem[] => {
  const versionsById: Record<string, number[]> = {}
  for (const definition of Object.values(definitions)) {
    if (typeof definition.version !== 'number') continue
    ;(versionsById[definition.versionlessId] ||= []).push(definition.version)
  }

  return Object.entries(traits).map(([id, data]) => {
    const parsed = parseTraitId(id)
    const definition = definitions[id]
    return {
      id,
      parsed,
      data,
      definition,
      views: resolveTraitViews(parsed, definition, registry),
      label: definition?.name || parsed.name,
      group: getGroupLabel(parsed, definition),
      definedVersions: definition
        ? []
        : (versionsById[parsed.versionlessId] || []).sort((a, b) => a - b),
    }
  })
}

/** Tooltip of a trait shown raw, naming the versions that do have a definition. */
export const getMissingDefinitionText = (item: TraitItem): string => {
  if (!item.definedVersions.length) return 'No installed addon defines this trait, shown as stored'
  const versions = item.definedVersions.map((version) => `v${version}`).join(', ')
  return `Only ${versions} of this trait ${
    item.definedVersions.length > 1 ? 'are' : 'is'
  } defined, shown as stored`
}

const groupRank = (label: string) => {
  const index = GROUP_ORDER.indexOf(label)
  return index === -1 ? GROUP_ORDER.length : index
}

/** Groups traits by namespace: core groups first in a fixed order, then the rest by name. */
export const groupTraits = (items: TraitItem[]): TraitGroup[] => {
  const groups: Record<string, TraitItem[]> = {}
  for (const item of items) (groups[item.group] ||= []).push(item)

  return Object.entries(groups)
    .sort(([a], [b]) => groupRank(a) - groupRank(b) || a.localeCompare(b))
    .map(([label, groupItems]) => ({
      label,
      items: groupItems.sort(
        (a, b) =>
          a.label.localeCompare(b.label) || (a.parsed.version ?? 0) - (b.parsed.version ?? 0),
      ),
    }))
}
