import { expect, test } from '@playwright/test'
import { parseTraitId } from '../../shared/src/components/RepresentationTraits/utils/parseTraitId'
import {
  buildTraitItems,
  getMissingDefinitionText,
  groupTraits,
  hasTraits,
  hasTraitValues,
  resolveTraitRenderer,
} from '../../shared/src/components/RepresentationTraits/utils/traitModel'
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

test('resolves dedicated widget, then schema view, then raw table', () => {
  const sequence = definitions['ayon.time.Sequence.v1']
  const parsed = parseTraitId(sequence.id)
  const registry = {
    'ayon.time.Sequence': { component: 'sequence', versions: [1] },
    frames: { component: 'frames' },
  }

  expect(resolveTraitRenderer(parsed, { ...sequence, ui: { widget: 'frames' } }, registry)).toEqual(
    { kind: 'widget', widget: 'frames' },
  )
  // unknown ui.widget falls back to the widget of the trait
  expect(resolveTraitRenderer(parsed, { ...sequence, ui: { widget: 'nope' } }, registry)).toEqual({
    kind: 'widget',
    widget: 'ayon.time.Sequence',
  })
  // a widget that does not support the version is skipped
  expect(resolveTraitRenderer(parseTraitId('ayon.time.Sequence.v2'), sequence, registry)).toEqual({
    kind: 'schema',
  })
  expect(resolveTraitRenderer(parsed, sequence, {})).toEqual({ kind: 'schema' })
  expect(resolveTraitRenderer(parsed, undefined, {})).toEqual({ kind: 'raw' })
})

test('groups traits by namespace in a fixed order', () => {
  const groups = groupTraits(buildTraitItems({ ...traits.exr, ...traits.addon }, definitions, {}))

  expect(groups.map((group) => group.label)).toEqual(['Content', 'Time', '2D', 'Meta', 'shotgrid'])
  expect(groups[1].items.map((item) => item.label)).toEqual(['FrameRanged', 'Handles', 'Sequence'])
  const kinds = groups.flatMap((group) => group.items.map((item) => item.renderer.kind))
  expect(kinds.filter((kind) => kind === 'raw')).toHaveLength(1)
  expect(groups[4].items[0]).toMatchObject({ label: 'moviepath', definedVersions: [] })
})

test('legacy trait versions without a definition are shown raw', () => {
  const items = buildTraitItems(traits.legacyExr, definitions, {})
  const byId = Object.fromEntries(items.map((item) => [item.id, item]))

  expect(byId['ayon.time.Sequence.v1'].renderer.kind).toBe('schema')
  expect(byId['ayon.time.FrameRanged.v1']).toMatchObject({
    renderer: { kind: 'raw' },
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
    label: 'Frame padding',
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
  expect(nested.map((item) => item.renderer.kind)).toEqual(['schema', 'schema'])
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
  expect(humanizeKey('frame_start_handle')).toBe('Frame start handle')
  expect(humanizeKey('displayWindow')).toBe('Display window')
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
