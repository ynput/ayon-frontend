import type { TraitDefinition, TraitDefinitions } from '@shared/api'
import { parseTraitId, ParsedTraitId } from './parseTraitId'

export type TraitRendererKind = 'widget' | 'schema' | 'raw'

export type TraitWidgetEntry<C = unknown> = {
  component: C
  // trait versions the widget can show, all versions when not set
  versions?: number[]
}

// keyed by versionless trait id, or by the widget name a definition asks for in `ui.widget`
export type TraitWidgetRegistry<C = unknown> = Record<string, TraitWidgetEntry<C>>

export type TraitRenderer = { kind: TraitRendererKind; widget?: string }

export type TraitItem = {
  id: string
  parsed: ParsedTraitId
  data: unknown
  definition?: TraitDefinition
  renderer: TraitRenderer
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

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** True when a representation `traits` value has at least one trait. */
export const hasTraits = (value: unknown): value is Record<string, unknown> =>
  isPlainObject(value) && Object.keys(value).length > 0

/** False for traits that store nothing (marker traits like Image), which start collapsed. */
export const hasTraitValues = (data: unknown): boolean =>
  data !== null && data !== undefined && !(isPlainObject(data) && !Object.keys(data).length)

/**
 * Picks how a trait is shown:
 * 1. a dedicated widget, by `ui.widget` of the definition or by versionless id (if it supports the version)
 * 2. the schema-driven view when the exact version has a definition
 * 3. the raw table otherwise
 */
export const resolveTraitRenderer = (
  parsed: ParsedTraitId,
  definition: TraitDefinition | undefined,
  registry: TraitWidgetRegistry,
): TraitRenderer => {
  const uiWidget = definition?.ui?.widget
  if (typeof uiWidget === 'string' && registry[uiWidget]) {
    return { kind: 'widget', widget: uiWidget }
  }

  const entry = registry[parsed.versionlessId]
  if (
    entry &&
    (!entry.versions || (parsed.version !== null && entry.versions.includes(parsed.version)))
  ) {
    return { kind: 'widget', widget: parsed.versionlessId }
  }

  if (definition?.schema) return { kind: 'schema' }
  return { kind: 'raw' }
}

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
      renderer: resolveTraitRenderer(parsed, definition, registry),
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
