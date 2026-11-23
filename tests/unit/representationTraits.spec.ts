import { expect, test } from '@playwright/test'
import { parseTraitId } from '../../shared/src/components/RepresentationTraits/utils/parseTraitId'
import {
  buildTraitItems,
  getMissingDefinitionText,
  groupTraits,
  hasTraits,
  hasTraitValues,
  pickTraitView,
  resolveTraitViews,
} from '../../shared/src/components/RepresentationTraits/utils/traitModel'
import type { TraitView } from '../../shared/src/components/RepresentationTraits/utils/traitModel'
import {
  buildStripSegments,
  compileFrameRegex,
  formatBytes,
  formatFrameRanges,
  getCommonDirectory,
  getMissingFrames,
  getSegmentTooltip,
  shortHash,
  sumSizes,
  toFileEntries,
  withFrames,
} from '../../shared/src/components/RepresentationTraits/views/files'
import {
  findTraitData,
  getFileLayout,
  getFps,
  getFrameRange,
  getHandles,
  getSchemaFieldType,
  getTraitFiles,
  summarizeFiles,
} from '../../shared/src/components/RepresentationTraits/utils/traitFields'
import {
  getItemSchema,
  getSchemaFields,
  getValueKind,
  humanizeKey,
  matchesSchema,
  pickSchema,
} from '../../shared/src/components/RepresentationTraits/utils/schemaFields'
import type { TraitDefinitions } from '../../shared/src/api/queries/traits/types'
import { traitFixtures } from './support/traitFixtures'

const definitions: TraitDefinitions = Object.fromEntries(
  traitFixtures.definitions.map((definition) => [definition.id, definition]),
) as TraitDefinitions
const { traits } = traitFixtures

const schemaOf = (id: string) => definitions[id].schema!

test('parses versioned, addon and unversioned trait ids', () => {
  expect(parseTraitId('ayon.2d.PixelBased.v1')).toEqual({
    id: 'ayon.2d.PixelBased.v1',
    namespace: 'ayon.2d',
    name: 'PixelBased',
    version: 1,
    versionlessId: 'ayon.2d.PixelBased',
  })
  expect(parseTraitId('shotgrid.moviepath.v12')).toMatchObject({
    namespace: 'shotgrid',
    name: 'moviepath',
    version: 12,
    versionlessId: 'shotgrid.moviepath',
  })
  expect(parseTraitId('custom.Thing')).toMatchObject({ name: 'Thing', version: null })
  expect(parseTraitId('Thing.v1')).toMatchObject({ namespace: '', name: 'Thing', version: 1 })
})

test('lists widget views, then schema view, then stored values', () => {
  const sequence = definitions['ayon.time.Sequence.v1']
  const parsed = parseTraitId(sequence.id)
  const view = (id: string, versions?: number[]) => ({
    id,
    label: id,
    icon: 'x',
    component: id,
    versions,
  })
  const registry = {
    'ayon.time.Sequence': [view('bar', [1]), view('list')],
    frames: [view('frames'), view('bar')],
  }
  const ids = (views: TraitView[]) => views.map((item) => `${item.kind}:${item.id}`)

  // ui.widget views first; a view id listed twice is shown once
  expect(
    ids(resolveTraitViews(parsed, { ...sequence, ui: { widget: 'frames' } }, registry)),
  ).toEqual(['widget:frames', 'widget:bar', 'widget:list', 'schema:schema', 'raw:raw'])
  // unknown ui.widget falls back to the views of the trait
  expect(ids(resolveTraitViews(parsed, { ...sequence, ui: { widget: 'nope' } }, registry))).toEqual(
    ['widget:bar', 'widget:list', 'schema:schema', 'raw:raw'],
  )
  // a view that does not support the version is skipped
  expect(ids(resolveTraitViews(parseTraitId('ayon.time.Sequence.v2'), sequence, registry))).toEqual(
    ['widget:list', 'schema:schema', 'raw:raw'],
  )
  expect(ids(resolveTraitViews(parsed, sequence, {}))).toEqual(['schema:schema', 'raw:raw'])
  expect(ids(resolveTraitViews(parsed, undefined, {}))).toEqual(['raw:raw'])

  const views = resolveTraitViews(parsed, sequence, registry)
  expect(pickTraitView(views, 'schema').id).toBe('schema')
  // a remembered view the trait does not have falls back to the default
  expect(pickTraitView(views, 'frames').id).toBe('bar')
  expect(pickTraitView(views, undefined).id).toBe('bar')
})

test('file entries use Sequence frame numbers and FrameRanged for missing frames', () => {
  const files = Array.from({ length: 6 }, (_, index) => ({
    file_path: `/proj/sh010/render.${1001 + index * (index > 2 ? 2 : 1)}.exr`,
    file_size: index === 4 ? 10 : 1000,
    file_hash: index === 0 ? 'abcdef0123456789' : null,
    file_hash_type: index === 0 ? 'sha256' : null,
  }))
  // frames 1001, 1002, 1003, 1007, 1009, 1011
  const layout = getFileLayout('ayon.content.FileLocations.v2')!
  const entries = toFileEntries(getTraitFiles({ file_paths: files }, layout)!)
  const sequence = traits.exr['ayon.time.Sequence.v1']
  const framed = withFrames(entries, sequence)
  expect(framed.map((entry) => entry.frame)).toEqual([1001, 1002, 1003, 1007, 1009, 1011])
  expect(withFrames(entries, undefined)[0].frame).toBeNull()
  // without a regex the trailing digits are used
  expect(withFrames(entries, { frame_padding: 4 })[3].frame).toBe(1007)

  expect(getCommonDirectory(framed.map((entry) => entry.path))).toBe('/proj/sh010/')
  expect(getCommonDirectory(['C:\\a\\b.exr', 'C:\\a\\c\\d.exr'])).toBe('C:\\a\\')
  expect(getCommonDirectory(['/a.exr'])).toBe('/')
  expect(sumSizes(framed)).toBe(5010)

  const range = { start: 1000, end: 1011 }
  expect(formatFrameRanges(getMissingFrames(framed, range))).toBe('1000, 1004-1006, 1008, 1010')
  expect(getMissingFrames(entries)).toEqual([])

  const segments = buildStripSegments(framed, 200, range)
  expect(
    segments.map((s) => (s.kind === 'gap' ? `gap ${s.frameStart}-${s.frameEnd}` : s.frameStart)),
  ).toEqual([
    'gap 1000-1000',
    1001,
    1002,
    1003,
    'gap 1004-1006',
    1007,
    'gap 1008-1008',
    1009,
    'gap 1010-1010',
    1011,
  ])
  expect(getSegmentTooltip(segments[1])).toBe(
    'Frame 1001\n/proj/sh010/render.1001.exr\nSize: 1000 B\nHash: sha256:abcdef0123456789',
  )
  expect(getSegmentTooltip(segments[4])).toBe('Missing frames 1004-1006')

  // long lists are bucketed
  const bucketed = buildStripSegments(framed, 3, range)
  expect(bucketed.length).toBeLessThanOrEqual(4)
  expect(
    bucketed.filter((s) => s.kind === 'files').flatMap((s) => (s.kind === 'files' ? s.files : [])),
  ).toHaveLength(6)

  expect(formatBytes(1048576)).toBe('1.0 MB')
  expect(formatBytes(null)).toBe('—')
  expect(shortHash(framed[0], 6)).toBe('sha256:abcdef…')
  // legacy v1 stored the list as a string, and has no file layout
  expect(getFileLayout('ayon.content.FileLocations.v1')).toBeUndefined()
  expect(getTraitFiles(traits.legacyExr['ayon.content.FileLocations.v1'], layout)).toBeNull()
  expect(compileFrameRegex('(?P<index>\\d+')).toBeNull()
})

test('file views follow the file layouts', () => {
  const view = (id: string) => ({ id, label: id, icon: 'x', component: id })
  const registry = { 'files:list': [view('strip')], 'files:single': [view('card')] }
  const ids = (id: string, definition = definitions[id]) =>
    resolveTraitViews(parseTraitId(id), definition, registry).map((item) => item.id)

  expect(ids('ayon.content.FileLocations.v2')).toEqual(['strip', 'schema', 'raw'])
  expect(ids('ayon.content.FileLocation.v2')).toEqual(['card', 'schema', 'raw'])
  expect(ids('ayon.content.FileLocations.v1')).toEqual(['raw'])

  const files = getTraitFiles(
    traits.exr['ayon.content.FileLocations.v2'],
    getFileLayout('ayon.content.FileLocations.v2')!,
  )!
  expect(summarizeFiles(files)).toEqual({ count: 2, totalSize: 2097152, extensions: ['exr'] })
})

test('trait fields are read across versions', () => {
  // FrameRanged v1 stores fps as a string, v2 as a ratio
  expect(getFps(findTraitData(traits.legacyExr, 'ayon.time.FrameRanged'))).toBe(25)
  expect(getFps({ frame_rate_numerator: 24000, frame_rate_denominator: 1001 })).toBeCloseTo(
    23.976,
    3,
  )
  expect(getFrameRange(findTraitData(traits.exr, 'ayon.time.FrameRanged'))).toMatchObject({
    start: 1001,
    end: 1002,
    fps: 25,
  })
  expect(getFrameRange({ frame_start: 5, frame_end: 1 })).toBeNull()
  expect(getHandles(findTraitData(traits.exr, 'ayon.time.Handles'))).toEqual({
    start: 0,
    end: 0,
    inclusive: false,
  })
  // the highest version wins when several are present
  expect(
    findTraitData({ 'a.b.T.v1': { x: 1 }, 'a.b.T.v2': { x: 2 }, 'a.b.Other.v3': {} }, 'a.b.T'),
  ).toEqual({ x: 2 })

  // fields the server indexes for search
  const pixel = schemaOf('ayon.2d.PixelBased.v1')
  expect(getSchemaFieldType(pixel.properties?.display_window_width)).toBe('integer')
  const sequence = schemaOf('ayon.time.Sequence.v1')
  expect(getSchemaFieldType(sequence.properties?.frame_regex)).toBeUndefined()
})

test('groups traits by namespace in a fixed order', () => {
  const groups = groupTraits(buildTraitItems({ ...traits.exr, ...traits.addon }, definitions, {}))

  expect(groups.map((group) => group.label)).toEqual(['Content', 'Time', '2D', 'Meta', 'shotgrid'])
  expect(groups[1].items.map((item) => item.label)).toEqual(['FrameRanged', 'Handles', 'Sequence'])
  const defaults = groups.flatMap((group) => group.items.map((item) => item.views[0].kind))
  expect(defaults.filter((kind) => kind === 'raw')).toHaveLength(1)
  expect(groups[4].items[0]).toMatchObject({ label: 'moviepath', definedVersions: [] })
})

test('legacy trait versions without a definition are shown raw', () => {
  const items = buildTraitItems(traits.legacyExr, definitions, {})
  const byId = Object.fromEntries(items.map((item) => [item.id, item]))

  expect(byId['ayon.time.Sequence.v1'].views[0].kind).toBe('schema')
  expect(byId['ayon.time.FrameRanged.v1']).toMatchObject({
    views: [{ kind: 'raw' }],
    definedVersions: [2],
  })
  expect(getMissingDefinitionText(byId['ayon.time.FrameRanged.v1'])).toBe(
    'Only v2 of this trait is defined, shown as stored',
  )
  expect(getMissingDefinitionText(buildTraitItems(traits.addon, definitions, {})[0])).toBe(
    'No installed addon defines this trait, shown as stored',
  )
})

test('schema fields follow the definition order with labels and descriptions', () => {
  const schema = schemaOf('ayon.time.Sequence.v1')
  const fields = getSchemaFields(schema, traits.exr['ayon.time.Sequence.v1'], schema)

  expect(fields.map((field) => field.key)).toEqual([
    'frame_padding',
    'gaps_policy',
    'frame_regex',
    'frame_spec',
  ])
  expect(fields[0]).toMatchObject({
    label: 'Frame Padding',
    description: 'Frame padding.',
    required: true,
    inSchema: true,
    matches: true,
  })
  expect(getValueKind(fields[1].schema, fields[1].value)).toBe('enum')
  expect(getValueKind(fields[2].schema, fields[2].value)).toBe('regex')
  expect(getValueKind(fields[3].schema, fields[3].value)).toBe('empty')
})

test('stored values that do not match the definition are flagged', () => {
  const schema = schemaOf('ayon.time.Sequence.v1')
  const fields = getSchemaFields(
    schema,
    { ...traits.legacyExr['ayon.time.Sequence.v1'], extra: 1 },
    schema,
  )
  const byKey = Object.fromEntries(fields.map((field) => [field.key, field]))

  // older ayon-core stored enums as `str(member)`
  expect(byKey.gaps_policy.matches).toBe(false)
  expect(byKey.frame_padding.matches).toBe(true)
  expect(byKey.extra).toMatchObject({ inSchema: false, label: 'Extra' })
  expect(fields.at(-1)?.key).toBe('extra')
})

test('nested traits are resolved through $defs', () => {
  const schema = schemaOf('ayon.content.FileLocations.v2')
  const data = traits.exr['ayon.content.FileLocations.v2']
  const [filePaths] = getSchemaFields(schema, data, schema)

  expect(getValueKind(filePaths.schema, filePaths.value)).toBe('array')
  const itemSchema = getItemSchema(filePaths.schema, 0, data.file_paths[0], schema)
  expect(itemSchema.title).toBe('FileLocation')
  const itemFields = getSchemaFields(itemSchema, data.file_paths[0], schema)
  expect(itemFields.map((field) => [field.key, field.matches])).toEqual([
    ['file_path', true],
    ['file_size', true],
    ['file_hash', true],
    ['file_hash_type', true],
  ])
  expect(getValueKind(itemFields[0].schema, itemFields[0].value)).toBe('path')
})

test('bundle items are traits keyed by id', () => {
  const schema = schemaOf('ayon.content.Bundle.v1')
  const data = traits.bundle['ayon.content.Bundle.v1']
  const [items] = getSchemaFields(schema, data, schema)

  const itemSchema = getItemSchema(items.schema, 0, data.items[0], schema)
  expect(getValueKind(itemSchema, data.items[0])).toBe('traits')
  const nested = buildTraitItems(data.items[0], definitions, {})
  expect(nested.map((item) => item.views[0].kind)).toEqual(['schema', 'schema'])
})

test('optional and numeric types', () => {
  const schema = schemaOf('ayon.time.FrameRanged.v2')
  const fields = getSchemaFields(schema, traits.mp4['ayon.time.FrameRanged.v2'], schema)
  expect(fields.every((field) => field.matches)).toBe(true)

  const integer = { type: 'integer' }
  expect(matchesSchema(integer, 2, {})).toBe(true)
  expect(matchesSchema(integer, 2.5, {})).toBe(false)
  expect(matchesSchema({ type: 'number' }, 2.5, {})).toBe(true)
  expect(matchesSchema({ type: ['string', 'null'] }, null, {})).toBe(true)
  expect(matchesSchema({ $ref: '#/$defs/missing' }, 'anything', {})).toBe(true)

  const optionalRef = {
    anyOf: [{ $ref: '#/$defs/item' }, { type: 'null' }],
    $defs: { item: { type: 'object', title: 'Item' } },
  }
  expect(pickSchema(optionalRef, { a: 1 }, optionalRef).title).toBe('Item')
  expect(pickSchema(optionalRef, null, optionalRef)).toEqual({ type: 'null' })
})

test('helpers', () => {
  expect(humanizeKey('frame_start_handle')).toBe('Frame Start Handle')
  expect(humanizeKey('displayWindow')).toBe('Display Window')
  expect(hasTraits(traits.udim)).toBe(true)
  expect(hasTraits({})).toBe(false)
  expect(hasTraits(null)).toBe(false)
  expect(hasTraits([])).toBe(false)
  // marker traits like Image store nothing and start collapsed
  expect(hasTraitValues(traits.exr['ayon.2d.Image.v1'])).toBe(false)
  expect(hasTraitValues(null)).toBe(false)
  expect(hasTraitValues(traits.exr['ayon.meta.Tagged.v1'])).toBe(true)
  expect(hasTraitValues({ frame: 0 })).toBe(true)
})
