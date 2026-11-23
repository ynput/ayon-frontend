import { isPlainObject } from '../utils/isPlainObject'
import type { TraitFile } from '../utils/traitFields'

// Pure helpers of the file views. They work on files read through a file layout
// (utils/traitFields), never on trait field names. Kept free of React so unit tests can use them.

export { SEQUENCE_ID } from '../utils/traitFields'

export type FileEntry = TraitFile & {
  // file name without the directory
  name: string
  // frame number parsed with the Sequence trait regex, null when not a sequence
  frame: number | null
}

export type StripSegment =
  | {
      kind: 'files'
      files: FileEntry[]
      // first and last frame of the segment, null when files have no frame numbers
      frameStart: number | null
      frameEnd: number | null
      // total size, null when no file of the segment has a size
      size: number | null
    }
  | { kind: 'gap'; frameStart: number; frameEnd: number }

export const toFileEntries = (files: TraitFile[]): FileEntry[] =>
  files.map((file) => ({ ...file, name: file.path.split(/[\\/]/).pop() || file.path, frame: null }))

/** Finds a sibling trait by versionless id, whatever its version. */
export const findTrait = (
  traits: Record<string, unknown> | undefined,
  versionlessId: string,
): Record<string, unknown> | undefined => {
  if (!traits) return undefined
  const prefix = `${versionlessId}.v`
  for (const [id, value] of Object.entries(traits)) {
    if ((id === versionlessId || id.startsWith(prefix)) && isPlainObject(value)) return value
  }
  return undefined
}

/**
 * Compiles the Sequence `frame_regex` (Python syntax) for JavaScript.
 * Only named groups differ (`(?P<name>` -> `(?<name>`). Invalid patterns give null.
 */
export const compileFrameRegex = (pattern: unknown): RegExp | null => {
  if (typeof pattern !== 'string' || !pattern) return null
  try {
    return new RegExp(pattern.replace(/\(\?P</g, '(?<'))
  } catch {
    return null
  }
}

// trailing digits before the extension, used when the Sequence trait has no regex
const FALLBACK_FRAME = /(\d+)\.[^.\\/]+$/

/** Adds frame numbers to files, from the Sequence trait regex or the trailing digits of the name. */
export const withFrames = (
  entries: FileEntry[],
  sequence?: Record<string, unknown>,
): FileEntry[] => {
  if (!sequence) return entries
  const regex = compileFrameRegex(sequence.frame_regex)

  const parsed = entries.map((entry) => {
    const match = regex
      ? regex.exec(entry.name) || regex.exec(entry.path)
      : FALLBACK_FRAME.exec(entry.name)
    const raw = match ? match.groups?.index ?? match[1] : undefined
    const frame = raw !== undefined ? Number(raw) : NaN
    return { ...entry, frame: Number.isFinite(frame) ? frame : null }
  })
  // frame numbers only help when every file has a distinct one
  const frames = new Set(parsed.map((entry) => entry.frame))
  if (frames.has(null) || frames.size !== parsed.length) return entries
  return parsed.sort((a, b) => (a.frame as number) - (b.frame as number))
}

/** Directory shared by all paths, with a trailing separator, or empty when they share none. */
export const getCommonDirectory = (paths: string[]): string => {
  if (!paths.length) return ''
  const split = paths.map((path) => path.split(/(?<=[\\/])/))
  const first = split[0]
  let length = 0
  // the last part is a file name, never part of the directory
  while (
    length < first.length - 1 &&
    split.every((parts) => parts.length - 1 > length && parts[length] === first[length])
  ) {
    length++
  }
  return first.slice(0, length).join('')
}

export const sumSizes = (entries: FileEntry[]): number | null => {
  const sizes = entries.map((entry) => entry.size).filter((size): size is number => size !== null)
  return sizes.length ? sizes.reduce((sum, size) => sum + size, 0) : null
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

/** Binary size with one decimal, e.g. `1048576` -> `1.0 MB`. */
export const formatBytes = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return '—'
  let value = bytes
  let unit = 0
  while (Math.abs(value) >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit++
  }
  return unit === 0 ? `${value} B` : `${value.toFixed(1)} ${UNITS[unit]}`
}

/** `sha256:abcdef0123…` style short hash for compact display. */
export const shortHash = (entry: Pick<FileEntry, 'hash' | 'hashType'>, length = 12): string => {
  if (!entry.hash) return ''
  const hash = entry.hash.length > length ? `${entry.hash.slice(0, length)}…` : entry.hash
  return entry.hashType ? `${entry.hashType}:${hash}` : hash
}

/** Frame ranges of a sorted list of frames, e.g. `[1, 2, 3, 5]` -> `1-3, 5`. */
export const formatFrameRanges = (frames: number[]): string => {
  const ranges: string[] = []
  let start = frames[0]
  let previous = frames[0]
  for (const frame of [...frames.slice(1), NaN]) {
    if (frame === previous + 1) {
      previous = frame
      continue
    }
    if (start !== undefined) ranges.push(start === previous ? `${start}` : `${start}-${previous}`)
    start = frame
    previous = frame
  }
  return ranges.join(', ')
}

/** Frames between the first and last file (or the given range) that have no file. */
export const getMissingFrames = (
  entries: FileEntry[],
  range?: { start: number; end: number },
): number[] => {
  const frames = entries
    .map((entry) => entry.frame)
    .filter((frame): frame is number => frame !== null)
  if (frames.length !== entries.length || !frames.length) return []
  const present = new Set(frames)
  const start = range?.start ?? frames[0]
  const end = range?.end ?? frames[frames.length - 1]
  const missing: number[] = []
  // guard against absurd ranges stored by mistake
  if (end - start > 1_000_000) return missing
  for (let frame = start; frame <= end; frame++) if (!present.has(frame)) missing.push(frame)
  return missing
}

const filesSegment = (files: FileEntry[]): StripSegment => ({
  kind: 'files',
  files,
  frameStart: files[0].frame,
  frameEnd: files[files.length - 1].frame,
  size: sumSizes(files),
})

/**
 * Segments of the compact file strip. Files of a sequence are laid out by frame, missing frames become
 * gap segments. Long lists are bucketed so the strip never has more than `maxSegments` cells.
 */
export const buildStripSegments = (
  entries: FileEntry[],
  maxSegments = 200,
  range?: { start: number; end: number },
): StripSegment[] => {
  if (!entries.length) return []

  const byFrame = entries.every((entry) => entry.frame !== null)
  if (!byFrame) {
    const bucket = Math.ceil(entries.length / maxSegments)
    const segments: StripSegment[] = []
    for (let i = 0; i < entries.length; i += bucket) {
      segments.push(filesSegment(entries.slice(i, i + bucket)))
    }
    return segments
  }

  const frameOf = (entry: FileEntry) => entry.frame as number
  const start = Math.min(range?.start ?? Infinity, frameOf(entries[0]))
  const end = Math.max(range?.end ?? -Infinity, frameOf(entries[entries.length - 1]))
  const bucket = Math.max(1, Math.ceil((end - start + 1) / maxSegments))
  const byBucket = new Map<number, FileEntry[]>()
  for (const entry of entries) {
    const key = Math.floor((frameOf(entry) - start) / bucket)
    const files = byBucket.get(key)
    files ? files.push(entry) : byBucket.set(key, [entry])
  }

  const segments: StripSegment[] = []
  const count = Math.ceil((end - start + 1) / bucket)
  for (let key = 0; key < count; key++) {
    const files = byBucket.get(key)
    if (files) {
      segments.push(filesSegment(files))
      continue
    }
    const frameStart = start + key * bucket
    const frameEnd = Math.min(end, frameStart + bucket - 1)
    const last = segments[segments.length - 1]
    // merge neighbouring gaps into one
    if (last?.kind === 'gap') last.frameEnd = frameEnd
    else segments.push({ kind: 'gap', frameStart, frameEnd })
  }
  return segments
}

/** Hover text of a strip segment: path, size and hash of one file, or a summary of many. */
export const getSegmentTooltip = (segment: StripSegment): string => {
  if (segment.kind === 'gap') {
    return segment.frameStart === segment.frameEnd
      ? `Missing frame ${segment.frameStart}`
      : `Missing frames ${segment.frameStart}-${segment.frameEnd}`
  }
  if (segment.files.length === 1) {
    const [file] = segment.files
    return [
      file.frame !== null ? `Frame ${file.frame}` : null,
      file.path,
      `Size: ${formatBytes(file.size)}`,
      `Hash: ${file.hash ? `${file.hashType ? `${file.hashType}:` : ''}${file.hash}` : '—'}`,
    ]
      .filter(Boolean)
      .join('\n')
  }
  const frames =
    segment.frameStart !== null ? `Frames ${segment.frameStart}-${segment.frameEnd}\n` : ''
  return `${frames}${segment.files.length} files\n${segment.files[0].name}\n…\n${
    segment.files[segment.files.length - 1].name
  }\nSize: ${formatBytes(segment.size)}`
}
