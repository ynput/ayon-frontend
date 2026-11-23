import { expect, test } from '@playwright/test'
import {
  buildTraitFieldOptions,
  buildTraitIdsOption,
  expressionToFilters,
  findTraitFields,
  flattenTraitFields,
  getTraitFieldOptionId,
  normalizeFieldName,
  parseTraitFieldExpression,
} from '../../shared/src/components/SearchFilter/traitFields/traitFieldOptions'
import type { TraitUsage } from '../../shared/src/api/generated/traits'

const TRAITS: TraitUsage[] = [
  {
    id: 'ayon.2d.PixelBased',
    name: 'PixelBased',
    versions: [1],
    count: 10,
    fields: [
      { name: 'display_window_width', title: 'Display Window Width', type: 'integer' },
      { name: 'display_window_height', title: 'Display Window Height', type: 'integer' },
      { name: 'pixel_aspect_ratio', title: 'Pixel Aspect Ratio', type: 'float' },
    ],
  },
  {
    id: 'ayon.time.Sequence',
    name: 'Sequence',
    versions: [1],
    fields: [
      {
        name: 'gaps_policy',
        title: 'Gaps Policy',
        type: 'string',
        enum: ['forbidden', 'missing'],
      },
    ],
  },
  {
    id: 'ayon.color.ColorManaged',
    name: 'ColorManaged',
    fields: [{ name: 'color_space', title: 'Color Space', type: 'string' }],
  },
  {
    id: 'ayon.meta.Tagged',
    name: 'Tagged',
    fields: [{ name: 'tags', title: 'Tags', type: 'list_of_strings' }],
  },
  {
    id: 'ayon.time.Handles',
    name: 'Handles',
    fields: [
      { name: 'inclusive', title: 'Inclusive', type: 'boolean' },
      { name: 'frame_start_handle', title: 'Frame Start Handle', type: 'integer' },
    ],
  },
  {
    id: 'ayon.time.FrameRanged',
    name: 'FrameRanged',
    fields: [{ name: 'frame_start', title: 'Frame Start', type: 'integer' }],
  },
]

const FIELDS = flattenTraitFields(TRAITS)

const parse = (text: string, fields = FIELDS) => {
  const result = parseTraitFieldExpression(text, fields)
  if (!result.ok) throw new Error(result.error)
  return result.expression
}

const toFilters = (text: string) =>
  expressionToFilters(parse(text)).map(({ id, ...filter }) => ({
    optionId: id.split('__')[0],
    ...filter,
    values: filter.values?.map(({ id, label }) => ({ id, label })),
  }))

const found = (name: string, fields = FIELDS) =>
  findTraitFields(name, fields).map(({ traitId, field }) => `${traitId}/${field.name}`)

test.describe('field names', () => {
  test('normalizes names', () => {
    expect(normalizeFieldName('PixelBased:Display Window Width')).toBe(
      'pixelbaseddisplaywindowwidth',
    )
    expect(normalizeFieldName('PixelBased:display_window_width')).toBe(
      normalizeFieldName('pixelbased : Display Window Width'),
    )
  })

  test('trait and field by name, title or trait id', () => {
    const width = ['ayon.2d.PixelBased/display_window_width']
    expect(found('PixelBased:display_window_width')).toEqual(width)
    expect(found('pixelbased:Display Window Width')).toEqual(width)
    expect(found('ayon.2d.PixelBased:display_window_width')).toEqual(width)
  })

  test('synonyms', () => {
    const traits = TRAITS.map((trait) =>
      trait.id === 'ayon.2d.PixelBased'
        ? {
            ...trait,
            fields: trait.fields?.map((field) =>
              field.name === 'display_window_width'
                ? { ...field, synonyms: ['resolution:width'] }
                : field,
            ),
          }
        : trait,
    )
    expect(found('resolution:width', flattenTraitFields(traits))).toEqual([
      'ayon.2d.PixelBased/display_window_width',
    ])
  })

  test('field alone when unique', () => {
    expect(found('color space')).toEqual(['ayon.color.ColorManaged/color_space'])
  })

  test('ambiguous field alone', () => {
    const result = parseTraitFieldExpression('frame_start = 1', [
      ...FIELDS,
      {
        traitId: 'ayon.x.Other',
        traitName: 'Other',
        field: { name: 'frame_start', title: 'Frame Start', type: 'integer' },
      },
    ])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.candidates?.length).toBe(2)
  })
})

test.describe('parse expressions', () => {
  test('integer equality', () => {
    const expression = parse('PixelBased:display_window_width = 1920')
    expect(expression.operator).toBe('=')
    expect(expression.values).toEqual([1920])
  })

  test('comma list and not equal', () => {
    const expression = parse('PixelBased:display_window_width != 1920, 2048, 1920')
    expect(expression.operator).toBe('!=')
    expect(expression.values).toEqual([1920, 2048])
  })

  test('float', () => {
    expect(parse('PixelBased:pixel_aspect_ratio = 2.0').values).toEqual([2])
  })

  test('quoted strings keep commas', () => {
    expect(parse('ColorManaged:color_space = "ACES - ACEScg, linear", sRGB').values).toEqual([
      'ACES - ACEScg, linear',
      'sRGB',
    ])
  })

  test('enum values are case insensitive', () => {
    expect(parse('Sequence:gaps_policy = Forbidden').values).toEqual(['forbidden'])
  })

  test('booleans', () => {
    expect(parse('Handles:inclusive = yes').values).toEqual([true])
  })

  test('errors', () => {
    const invalid = parseTraitFieldExpression('PixelBased:display_window_width = wide', FIELDS)
    expect(invalid.ok).toBe(false)
    if (!invalid.ok) expect(invalid.error).toContain('not a valid integer')
    const unknownEnum = parseTraitFieldExpression('Sequence:gaps_policy = maybe', FIELDS)
    expect(!unknownEnum.ok && unknownEnum.error).toContain('one of forbidden, missing')
    expect(parseTraitFieldExpression('nothing:here = 1', FIELDS).ok).toBe(false)
    expect(parseTraitFieldExpression('PixelBased:display_window_width', FIELDS).ok).toBe(false)
  })
})

test.describe('filters', () => {
  // Typed values are not custom values, so the query uses exact matches (`in`), not `like`
  test('typed values become exact filters', () => {
    expect(toFilters('PixelBased:display_window_width != 1920, 2048')).toEqual([
      {
        optionId: 'representation_traits/ayon.2d.PixelBased/display_window_width',
        type: 'integer',
        label: 'PixelBased: Display Window Width',
        inverted: true,
        operator: undefined,
        singleSelect: false,
        values: [
          { id: '1920', label: '1920' },
          { id: '2048', label: '2048' },
        ],
      },
    ])
    const [tags] = toFilters('Tagged:tags = review, hero')
    expect(tags.operator).toBe('OR')
    const [inclusive] = toFilters('Handles:inclusive = no')
    expect(inclusive.singleSelect).toBe(true)
    expect(inclusive.values).toEqual([{ id: 'false', label: 'No' }])
  })
})

test.describe('options', () => {
  test('one option per trait field in the representation scope', () => {
    const options = buildTraitFieldOptions(FIELDS, { loadFieldValues: async () => [] })
    const width = options.find(
      (option) => option.id === getTraitFieldOptionId('ayon.2d.PixelBased', 'display_window_width'),
    )
    expect(width?.id).toBe('representation_traits/ayon.2d.PixelBased/display_window_width')
    expect(width?.label).toBe('PixelBased: Display Window Width')
    expect(width?.allowsCustomValues).toBe(true)
    expect(width?.loadValues).toBeDefined()
    expect(width?.searchLabel).toContain('PixelBased:display_window_width')

    const gaps = options.find((option) => option.id.endsWith('gaps_policy'))
    expect(gaps?.values?.map((value) => value.id)).toEqual(['forbidden', 'missing'])
    expect(gaps?.allowsCustomValues).toBe(false)
    expect(gaps?.loadValues).toBeUndefined()

    const inclusive = options.find((option) => option.id.endsWith('inclusive'))
    expect(inclusive?.singleSelect).toBe(true)
  })

  test('has trait option', () => {
    expect(buildTraitIdsOption([])).toBeNull()
    const option = buildTraitIdsOption(TRAITS.slice(0, 1))
    expect(option?.id).toBe('representation_traitIds')
    expect(option?.values?.map((value) => value.id)).toEqual(['ayon.2d.PixelBased'])
  })
})
