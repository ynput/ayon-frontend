import type { TraitJsonSchema } from '@shared/api'
import { isPlainObject } from './isPlainObject'
import { parseTraitId } from './parseTraitId'

// Reading trait fields for views that combine traits or show several versions of a trait.
// Versions differ (FrameRanged v1 stores fps as a string, v2 as a ratio), so these helpers know
// the core traits they read. Views of other traits read their own fields.

/** Data of a sibling trait by versionless id, the highest version when several are present. */
export const findTraitData = (
  traits: Record<string, unknown> | undefined,
  versionlessId: string,
): Record<string, unknown> | undefined => {
  let found: { version: number; data: Record<string, unknown> } | undefined
  for (const [id, data] of Object.entries(traits || {})) {
    const parsed = parseTraitId(id)
    if (parsed.versionlessId !== versionlessId || !isPlainObject(data)) continue
    const version = parsed.version ?? 0
    if (!found || version > found.version) found = { version, data }
  }
  return found?.data
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const ratio = /^\s*(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/.exec(value)
  const number = ratio
    ? Number(ratio[1]) / Number(ratio[2])
    : /^\s*-?\d+(?:\.\d+)?\s*$/.test(value)
    ? Number(value)
    : NaN
  return Number.isFinite(number) ? number : null
}

/** Reads a field as a number, null when it is missing or not a number. */
export const numberField = (data: unknown, field: string): number | null =>
  isPlainObject(data) ? toNumber(data[field]) : null

export const FRAME_RANGED_ID = 'ayon.time.FrameRanged'
export const HANDLES_ID = 'ayon.time.Handles'
export const PIXEL_BASED_ID = 'ayon.2d.PixelBased'
// The frame regex of a sequence names the frame numbers of its files
export const SEQUENCE_ID = 'ayon.time.Sequence'

/** Frames per second of FrameRanged: v2 stores a ratio, v1 a string. */
export const getFps = (data: unknown): number | null => {
  const numerator = numberField(data, 'frame_rate_numerator')
  if (numerator !== null) {
    const denominator = numberField(data, 'frame_rate_denominator') ?? 1
    return denominator ? numerator / denominator : null
  }
  return numberField(data, 'frames_per_second')
}

export type FrameRange = {
  start: number
  end: number
  frameIn: number | null
  frameOut: number | null
  step: number | null
  fps: number | null
}

/** Frame range of FrameRanged data (any version), null when it has no valid range. */
export const getFrameRange = (data: unknown): FrameRange | null => {
  const start = numberField(data, 'frame_start')
  const end = numberField(data, 'frame_end')
  if (start === null || end === null || end < start) return null
  return {
    start,
    end,
    frameIn: numberField(data, 'frame_in'),
    frameOut: numberField(data, 'frame_out'),
    step: numberField(data, 'step'),
    fps: getFps(data),
  }
}

export type Handles = { start: number; end: number; inclusive: boolean }

export const getHandles = (data: unknown): Handles => ({
  start: numberField(data, 'frame_start_handle') || 0,
  end: numberField(data, 'frame_end_handle') || 0,
  inclusive: isPlainObject(data) && data.inclusive === true,
})

//
// Files
//

/** Where a trait keeps its files: a list of file objects (`items`), or the trait is one file. */
export type TraitFileLayout = {
  items?: string
  path: string
  size?: string
  hash?: string
  hashType?: string
}

const FILE_FIELDS = {
  path: 'file_path',
  size: 'file_size',
  hash: 'file_hash',
  hashType: 'file_hash_type',
}

// File traits the views know, by versioned id. v1 of FileLocations stored paths as Python
// strings, those are shown as stored values.
export const FILE_TRAIT_LAYOUTS: Record<string, TraitFileLayout> = {
  'ayon.content.FileLocation.v2': FILE_FIELDS,
  'ayon.content.FileLocations.v2': { items: 'file_paths', ...FILE_FIELDS },
}

export const getFileLayout = (traitId: string): TraitFileLayout | undefined =>
  FILE_TRAIT_LAYOUTS[traitId]

export type TraitFile = {
  path: string
  size: number | null
  hash: string | null
  hashType: string | null
}

const readFile = (value: unknown, layout: TraitFileLayout): TraitFile | null => {
  if (!isPlainObject(value)) return null
  const path = value[layout.path]
  if (typeof path !== 'string') return null
  const pick = (key?: string) => (key ? value[key] : undefined)
  const size = pick(layout.size)
  const hash = pick(layout.hash)
  const hashType = pick(layout.hashType)
  return {
    path,
    size: typeof size === 'number' ? size : null,
    hash: typeof hash === 'string' ? hash : null,
    hashType: typeof hashType === 'string' ? hashType : null,
  }
}

/** Files of trait data, or null when the data does not fit the layout. */
export const getTraitFiles = (data: unknown, layout: TraitFileLayout): TraitFile[] | null => {
  if (!layout.items) {
    const file = readFile(data, layout)
    return file ? [file] : null
  }
  if (!isPlainObject(data)) return null
  const items = data[layout.items]
  if (!Array.isArray(items)) return null
  const files = items.map((item) => readFile(item, layout))
  return files.every((file): file is TraitFile => file !== null) ? files : null
}

/** Lowercase extension without the dot, empty when the name has none. */
export const getExtension = (path: string): string => {
  const name = path.split(/[\\/]/).pop() || ''
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export type FilesSummary = {
  count: number
  // null when no file has a size
  totalSize: number | null
  extensions: string[]
}

export const summarizeFiles = (files: TraitFile[]): FilesSummary => {
  const sizes = files.map((file) => file.size).filter((size): size is number => size !== null)
  const extensions = [...new Set(files.map((file) => getExtension(file.path)).filter(Boolean))]
  return {
    count: files.length,
    totalSize: sizes.length ? sizes.reduce((sum, size) => sum + size, 0) : null,
    extensions: extensions.sort(),
  }
}

//
// Search
//

/**
 * Filter type of a schema property, undefined when the server does not index it: objects,
 * lists of objects, regular expressions and paths. Same rules as the server.
 */
export const getSchemaFieldType = (schema: TraitJsonSchema | undefined): string | undefined => {
  if (!schema || schema.$ref) return undefined
  if (schema.anyOf) {
    const members = schema.anyOf.filter((member) => member.type !== 'null')
    return members.length === 1 ? getSchemaFieldType(members[0]) : undefined
  }
  const types = (Array.isArray(schema.type) ? schema.type : [schema.type]).filter(
    (type) => type && type !== 'null',
  )
  if (types.length !== 1) return undefined
  switch (types[0]) {
    case 'integer':
      return 'integer'
    case 'number':
      return 'float'
    case 'string':
      return ['regex', 'path', 'uri'].includes(schema.format || '') ? undefined : 'string'
    case 'boolean':
      return 'boolean'
    case 'array': {
      const item = getSchemaFieldType(schema.items)
      if (item === 'string') return 'list_of_strings'
      if (item === 'integer') return 'list_of_integers'
      return undefined
    }
    default:
      return undefined
  }
}

/** Name of a trait field in the typed search syntax: `PixelBased:display_window_width`. */
export const getFieldSearchName = (traitName: string, field: string) => `${traitName}:${field}`
