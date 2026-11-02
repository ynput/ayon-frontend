import { expect, test } from '@playwright/test'
import { checkLabel, checkName, parseAndFormatName } from '../../shared/src/util/checkName'

type Naming = NonNullable<Parameters<typeof parseAndFormatName>[1]>

test.describe('checkName', () => {
  test('accepts letters, digits, underscores, dashes and dots', () => {
    for (const name of ['sh010', 'Shot_010', 'v1.2-final', '_private', 'trailing_', 'a']) {
      expect(checkName(name), name).toEqual({ valid: true })
    }
  })

  test('rejects empty names, spaces, other characters and a leading or trailing dot or dash', () => {
    const chars = 'Name can only contain letters, numbers, underscores, dashes or dots'
    const invalid: [string | null | undefined, string][] = [
      ['', 'Name is required'],
      [null, 'Name is required'],
      [undefined, 'Name is required'],
      ['my shot', 'Spaces are not allowed in name'],
      ['tab\tname', 'Spaces are not allowed in name'],
      ['shot#1', chars],
      ['café', chars],
      ['shot/010', chars],
      ['.hidden', 'Name cannot start with dot or dash'],
      ['-shot', 'Name cannot start with dot or dash'],
      ['shot.', 'Name cannot end with dot or dash'],
      ['shot-', 'Name cannot end with dot or dash'],
    ]
    for (const [name, error] of invalid) {
      expect.soft(checkName(name), JSON.stringify(name)).toEqual({ valid: false, error })
    }
  })
})

test('checkLabel allows any text except single quotes', () => {
  for (const label of ['Shot 010', 'Café "crème" ✓', 'a/b (c)', '日本']) {
    expect(checkLabel(label), label).toEqual({ valid: true })
  }
  expect(checkLabel('')).toEqual({ valid: false, error: 'Label is required' })
  expect(checkLabel(null)).toEqual({ valid: false, error: 'Label is required' })
  expect(checkLabel("Director's cut")).toEqual({
    valid: false,
    error: "Label cannot contain single quotes (')",
  })
})

test.describe('parseAndFormatName', () => {
  test('defaults to lower case words joined without a separator', () => {
    expect(parseAndFormatName('My Shot 010')).toBe('myshot010')
  })

  test('applies the capitalization and separator of the anatomy naming', () => {
    const formats: [string, Naming, string][] = [
      ['my big shot', { capitalization: 'lower', separator: '_' }, 'my_big_shot'],
      ['my big shot', { capitalization: 'upper', separator: '-' }, 'MY-BIG-SHOT'],
      ['my BIG shot', { capitalization: 'pascal', separator: '' }, 'MyBigShot'],
      ['My BIG shot', { capitalization: 'camel', separator: '' }, 'myBigShot'],
      ['My BIG shot', { capitalization: 'keep', separator: '.' }, 'My.BIG.shot'],
      ['  lots   of\tspace  ', { capitalization: 'lower', separator: '_' }, 'lots_of_space'],
    ]
    for (const [label, naming, expected] of formats) {
      expect
        .soft(parseAndFormatName(label, naming), `${label} ${JSON.stringify(naming)}`)
        .toBe(expected)
    }
  })

  test('transliterates accents and drops characters without a latin form', () => {
    expect(parseAndFormatName('Café Crème', { separator: '_' })).toBe('cafe_creme')
    expect(parseAndFormatName('Žluťoučký kůň', { separator: '_' })).toBe('zlutoucky_kun')
    expect(parseAndFormatName('Straße', { separator: '_' })).toBe('strasse')
    expect(parseAndFormatName('日本 shot 🎬', { separator: '_' })).toBe('shot')
  })

  test('removes characters that are not allowed in names', () => {
    expect(parseAndFormatName('shot #1 (final)!', { separator: '_' })).toBe('shot_1_final')
    expect(parseAndFormatName("director's cut", { separator: '_' })).toBe('directors_cut')
  })

  test('the result never starts or ends with a dot, dash or underscore', () => {
    expect(parseAndFormatName('-intro. - outro_', { separator: '_' })).toBe('intro_outro')
    expect(parseAndFormatName('_hidden. file-', { separator: '' })).toBe('hiddenfile')
    expect(parseAndFormatName('v1.0 final', { separator: '' })).toBe('v1.0final')
  })

  test('every formatted name passes checkName unless nothing is left', () => {
    const labels = ['My Shot', '  -a-  ', 'Ü-ber_ .', 'x.y.z', '00 01', "it's ok", '...', '日本']
    const namings: Naming[] = [
      { capitalization: 'camel', separator: '' },
      { capitalization: 'upper', separator: '-' },
      { capitalization: 'keep', separator: '.' },
    ]
    for (const label of labels) {
      for (const naming of namings) {
        const name = parseAndFormatName(label, naming)
        if (name) expect(checkName(name), `${label} -> ${name}`).toEqual({ valid: true })
      }
    }
  })

  test('empty and whitespace only labels give an empty name', () => {
    expect(parseAndFormatName('')).toBe('')
    expect(parseAndFormatName('   ')).toBe('')
    expect(parseAndFormatName('!!!')).toBe('')
  })
})
